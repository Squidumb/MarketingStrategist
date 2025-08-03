import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from openai import AzureOpenAI
import autogen
import json
import requests
from typing import List, Dict
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from autogen.agentchat.contrib.gpt_assistant_agent import AssistantAgent
from autogen import  ConversableAgent, AssistantAgent, UserProxyAgent, config_list_from_json, register_function
from autogen_core.tools import FunctionTool
import pandas as pd
import numpy as np
 
config_list = config_list_from_json(env_or_file="CONFIG_LIST.json")
class SQLiteConnection:
    def __init__(self):
        self.conn = sqlite3.connect("bank_marketing_data.db", timeout=20, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
 
    def close(self):
        self.conn.close()
 
    def run_query(self, query, parameters=None):
        cursor = self.conn.cursor()
        try:
            if parameters:
                cursor.execute(query, parameters)
            else:
                cursor.execute(query)
            try:
                rows = cursor.fetchall()
                result = [dict(row) for row in rows]
            except sqlite3.Error:
                self.conn.commit()
                result = [{"affected_rows": cursor.rowcount}]
 
            return result
        except sqlite3.Error as e:
            self.conn.rollback()
            return [{"error": str(e)}]
        finally:
            cursor.close()
 
sql_conn = SQLiteConnection()
 
def execute_sql(sql_query: str) -> str:
    try:
        sql_result = sql_conn.run_query(sql_query)
        sql_conn.conn.commit()
        return sql_result
    except sqlite3.Error as e:
        return [{"error": str(e)}]
    finally:
        pass
 
def check_data_quality(df: pd.DataFrame, table_name: str) -> dict:
    """Check data quality metrics for a DataFrame"""
    quality_report = {
        "table_name": table_name,
        "row_count": len(df),
        "columns": {},
        "issues": []
    }
    if table_name != "products_data":
        missing_values = df.isnull().sum()
        for col, count in missing_values.items():
            if count > 0:
                quality_report["issues"].append({
                    "issue": f"Missing values detected in {col} ({count} records)",
                    "column": col,
                    "missing_count": count
                })
    if table_name == "customer_data":
        duplicate_rows = df[df.duplicated()]
        if not duplicate_rows.empty:
            quality_report["issues"].append({
                "issue": f"Duplicate rows detected ({len(duplicate_rows)} records)",
               
            })
 
        unique_columns = ["user_id", "email", "phone_number"]
        for col in unique_columns:
            if col in df.columns:
                duplicate_entries = df[df[col].duplicated(keep=False)]
                if not duplicate_entries.empty:
                    quality_report["issues"].append({
                        "issue": f"Non-unique values detected in {col} ({len(duplicate_entries)} records)",
       
                    })
 
        if 'age' in df.columns:
            outliers_age = df[(df['age'] < 1) | (df['age'] > 100)]
            if not outliers_age.empty:
                quality_report["issues"].append({
                    "issue": f"Outliers detected in age ({len(outliers_age)} records)",
                })
 
        if 'gender' in df.columns:
            outliers_gender = df[~df['gender'].isin(['M', 'F'])]
            if not outliers_gender.empty:
                quality_report["issues"].append({
                    "issue": f"Invalid values detected in gender ({len(outliers_gender)} records)",
       
                })
 
        if 'marital_status' in df.columns:
            outliers_marital_status = df[~df['marital_status'].isin(['M', 'S'])]
            if not outliers_marital_status.empty:
                quality_report["issues"].append({
                    "issue": f"Invalid values detected in marital_status ({len(outliers_marital_status)} records)",
                   
                })
 
    if table_name == "products_data":
        unique_columns = ["product_id", "product_name"]
        for col in unique_columns:
            if col in df.columns:
                duplicate_entries = df[df[col].duplicated(keep=False)]
                if not duplicate_entries.empty:
                    quality_report["issues"].append({
                        "issue": f"Non-unique values detected in {col} ({len(duplicate_entries)} records)",
                       
                    })
 
    if table_name == "interactions":
        duplicate_rows = df[df.duplicated()]
        if not duplicate_rows.empty:
            quality_report["issues"].append({
                "issue": f"Duplicate rows detected ({len(duplicate_rows)} records)",
               
            })
 
        unique_columns = ["interaction_id"]
        for col in unique_columns:
            if col in df.columns:
                duplicate_entries = df[df[col].duplicated(keep=False)]
                if not duplicate_entries.empty:
                    quality_report["issues"].append({
                        "issue": f"Non-unique values detected in {col} ({len(duplicate_entries)} records)",
       
                    })
 
    if table_name == "applications":
        today = pd.to_datetime('today').date()
        if 'application_date' in df.columns:
            outliers_application_date = df[pd.to_datetime(df['application_date'], format="%d/%m/%y", errors='coerce').dt.date >= today]
            if not outliers_application_date.empty:
                quality_report["issues"].append({
                    "issue": f"Outliers detected in application_date ({len(outliers_application_date)} records)",
                   
                })
 
        if 'application_amount' in df.columns:
            outliers_application_amount = df[df['application_amount'] < 0]
            if not outliers_application_amount.empty:
                quality_report["issues"].append({
                    "issue": f"Negative values detected in application_amount ({len(outliers_application_amount)} records)",
                   
                })
 
    if table_name == "channel_performance":
        positive_columns = [
            'budget', 'application_revenue', 'clicks', 'impressions',
            'cost_per_mille', 'click_through_rate_percentage', 'conversions',
            'conversion_rate'
        ]
        for col in positive_columns:
            if col in df.columns:
                negative_values = df[df[col] < 0]
                if not negative_values.empty:
                    quality_report["issues"].append({
                        "issue": f"Negative values detected in {col} ({len(negative_values)} records)",
                       
                    })
 
    return quality_report
 
class NumpyEncoder(json.JSONEncoder):
    """ Custom JSON Encoder for numpy data types """
    def default(self, obj):
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        elif isinstance(obj, (np.floating, float)):
            return float(obj)
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        else:
            return super(NumpyEncoder, self).default(obj)
 
with open("data_dictionary.txt", "r", encoding='utf-8') as file:
    data_dictionary = file.read()
 
user_proxy = UserProxyAgent(
    name="Data_Quality_Proxy",
    system_message="""You are a data quality expert. Your task is to analyze the data quality issues detected
    in the dataset and initiate a conversation with the Data_Cleaner agent to address and rectify these issues.
    """,
    code_execution_config=False,
    human_input_mode="TERMINATE"
)
sql_expert = AssistantAgent(
    name="SQL_Expert",
    system_message=f"""You are a Database Management Systems expert, specializing in writing SQL queries for a SQLite database.
    Analyze the user's natural language input and translate it into a specific SQL query. Consider the following data schema with example values for each:
    {data_dictionary}
    Note:
    - Do not use index as user_id and vice versa.
    - Age can be only an integer, but use the mean to calculate missing age values.
    - NEVER return  MORE than 15 records.
    - Generate only SQLite3 supporting queries( For example PERCENTILE_CONT is not supported by SQLite3.)
    - Do not perform any CREATE, ALTER and unnecessary SELECT operations.
    - Execute the query using the given tool.
    Strictly do not write delete or drop queries. Instead use UPDATE the table.
 
    Only respond with the SQL query, without code notation and additional text. Ensure your query is tailored to extract the most relevant information based on the user's question.""",
    llm_config={"config_list": config_list, "temperature": 0.1},
    description="""I am an expert in creating SQL queries for SQL database designed for a digital marketing store.
    I have the data schema and relevant context required for generating queries""",
)
 
clean_data_agent = AssistantAgent(
    name="Data_Cleaner",
    system_message=f"""You analyze data quality reports and suggest fixes.
     Analyze the user's natural language input and translate it into a specific SQL query. Consider the following data schema with example values for each and generate queries only according to:
    {data_dictionary}
    Your workflow:
    1. Review the quality issues
    2. Propose specific cleaning strategies
    3. Work with SQL_Expert to implement fixes
    4. Do not SQL query, instead give what to be generated to SQL_Expert
    5. Use median to impute missing values.
    Common fixes:
    - For missing values: prioritize intelligent imputation based on related data (e.g., using city information of other records to determine state), resort to mode only if necessary.
    - For duplicates: only consolidation, no deletion of data.
    - For outliers: capping or investigation and fix the issue using intelligent imputation.
    - For constraints: validation checks.
    - Do not use PERCENTILE CONT statement.
   
    Note:
    - user_id, interaction_id, application_id, product_id are the primary keys which starts from 1.(These ids can never be 0)
   
    First analyze the report, then request SQL fixes from SQL_Expert. Consider using advanced analytics or external data sources for more accurate imputation when possible.
    """,
    llm_config={"config_list": config_list,"temperature": 0.1}
)
 
data_check_group = autogen.GroupChat(
    agents=[user_proxy,clean_data_agent,sql_expert],
    messages=[],
    max_round=8,
    send_introductions=True
)
 
quality_manager = autogen.GroupChatManager(
    groupchat=data_check_group,
    llm_config={"config_list": config_list},
    system_message=""" You are a data quality checking team manager.
    Workflow:
    1) The input you get will be the quality report of the data.
    2) Data_Cleaner will give the suggestions on how to clean the data based on the quality report.
    3) SQL_Expert will generate queries based on the suggestion given by Data_Cleaner
    """
)
 
sql_expert.register_for_llm(name="SQL", description="A SQL query generator")(execute_sql)
user_proxy.register_for_execution(name="SQL")(execute_sql)
register_function(
    execute_sql,
    caller=sql_expert,
    executor=user_proxy,
    name="SQL",  
    description="A SQL query generator",
)
def check_and_fix_table(table_name: str, db_path: str = "bank_marketing_data.db"):
    """Complete workflow to check and fix a database table"""
    conn = sqlite3.connect(db_path)
   
    try:
        df = pd.read_sql(f"SELECT * FROM {table_name}", conn)
        quality_report = check_data_quality(df, table_name)
        print(f"\nQuality Report for {table_name}:")
        print(json.dumps(quality_report, cls=NumpyEncoder, indent=2))
       
        if quality_report["issues"]:
            print(f"\nIssues found in {table_name}. Initiating cleaning...")
            cleaning_response = user_proxy.initiate_chat(
                recipient=quality_manager,
                message=f"Data quality issues in {table_name}:\n{json.dumps(quality_report['issues'], cls=NumpyEncoder)}\n\n. Fix the issues.",
                max_turns=1
            )
            df_after = pd.read_sql(f"SELECT * FROM {table_name}", conn)
            new_report = check_data_quality(df_after, table_name)
            print(f"\nPost-Cleaning Quality Report:")
            print(json.dumps(new_report, cls=NumpyEncoder, indent=2))
           
            return {
                "status": "success",
                "original_report": quality_report,
                "new_report": new_report
            }
        else:
            print(f"\nNo issues found in {table_name}")
            return {
                "status": "clean",
                "report": quality_report
            }
           
    finally:
        conn.close()
 
 
def check_all_tables():
    """Check and clean all tables in the database"""
    tables_to_check = [
        "customer_data",
        "products_data",
        "interactions",
        "applications",
        "channel_performance",
        "customer_segments"
    ]
   
    results = {}
    for table in tables_to_check:
        print(f"\n{'='*50}")
        print(f"Processing table: {table}")
        print(f"{'='*50}")
        results[table] = check_and_fix_table(table)
   
    return results
 
def check():
    print("Starting database quality check and cleaning process...")
    final_results = check_all_tables()
   
    print("\nFinal Results Summary:")
    for table, result in final_results.items():
        status = result['status']
        issues_count = len(result.get('original_report', {}).get('issues', [])) if status == 'success' else 0
        print(f"{table}: {status.upper()} ({issues_count} issues fixed)" if status == 'success' else f"{table}: CLEAN")
   
    print("\nProcess completed.")
   
def final_check(attempt=1, max_attempts=3):
    print(f"Attempt {attempt}/{max_attempts}: Starting database quality check and cleaning process...")
    final_results = check_all_tables()
    print("\nFinal Results Summary:")
    any_issues = False
    for table, result in final_results.items():
        status = result['status']
        issues_count = len(result.get('original_report', {}).get('issues', [])) if status == 'success' else 0
 
        if issues_count > 0:
            any_issues = True
       
        print(f"{table}: {status.upper()} ({issues_count} issues fixed)" if status == 'success' else f"{table}: CLEAN")
 
    if any_issues:
        if attempt < max_attempts:
            print("\nIssues were found, rechecking...")
            final_check(attempt + 1, max_attempts)
        else:
            print("\nMaximum attempts reached. Please look into data.")
            # exit()
    else:
        print("\nNo issues found or all issues fixed.")
 
    print("\nProcess completed.")

final_check()
 