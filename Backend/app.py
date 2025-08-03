import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import  datetime
import autogen
import json
import requests
from typing import List, Dict
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from autogen.agentchat.contrib.gpt_assistant_agent import AssistantAgent
from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent
from autogen import  ConversableAgent, AssistantAgent, UserProxyAgent, config_list_from_json, register_function
from autogen_core.tools import FunctionTool
# from check import final_check
from tweet import tweet
load_dotenv()
 
app= Flask(__name__, static_folder='build', static_url_path='/')
CORS(app)
 
LOGIC_APP_URL = os.getenv("LOGIC_APP_URL")
 
class SQLiteConnection:
    def __init__(self):
        self.conn = sqlite3.connect(r"Database/bank_marketing_data.db", timeout=20, check_same_thread=False)
        # Enable dictionary access to rows
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
    sql_result = sql_conn.run_query(sql_query)
    return sql_result
 
config_list = config_list_from_json(env_or_file="CONFIG_LIST.json")
    
def get_llm_config(agent_type="general"):
    """Get LLM configuration based on agent type"""
    base_config = {
        "config_list": config_list,
        "timeout": 60,
        "cache_seed": 42,
        "temperature": 0.1
    }
    
    # Assign specific models for different agent types
    if agent_type == "validator":
        base_config["temperature"] = 0.1  # More deterministic for validation
    elif agent_type == "sql":
        base_config["temperature"] = 0.1  # Precise for SQL generation
    elif agent_type == "content":
        base_config["temperature"] = 0.6  # More creative for content
    elif agent_type == "web_research":
        base_config["temperature"] = 0.3  # Balanced for research
    elif agent_type == "response":
        base_config["temperature"] = 0.4  # Balanced for responses
    
    return base_config
 
def extract_webpage_content(url: str) -> str:
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36"
            )
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return f"Failed to retrieve content: Status code {response.status_code}"
 
        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()
 
        text = soup.get_text(separator='\n')
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        cleaned_text = '\n'.join(chunk for chunk in chunks if chunk)
 
        if len(cleaned_text) > 1000:
            cleaned_text = cleaned_text[:1000] + "... (content truncated)"
           
        return cleaned_text
    except Exception as e:
        return f"Error extracting content: {str(e)}"
 
def search_web(query: str, num_results: int = 3) -> List[Dict]:
    num_results = max(3, min(10, num_results))  
    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": query,
        "num": num_results,
        "gl": "us",
        "hl": "en"
    })
    headers = {
        'X-API-KEY': os.environ.get('SERPER_API_KEY'),
        'Content-Type': 'application/json'
    }
   
    try:
        response = requests.post(url, headers=headers, data=payload, timeout=15)
        response.raise_for_status()
        results = response.json()
        snippets = []
        formatted_results = []
 
        if 'organic' in results:
            for item in results['organic'][:num_results]:
                item_date_str = item.get('date')
               
                snippet = item.get('snippet', '').strip()
                # Snippet expansion: fetch full content if snippet too short (<150 chars)
                if snippet and len(snippet) < 150 and item.get('link'):
                    expanded_content = extract_webpage_content(item['link'])
                    if expanded_content and not expanded_content.startswith("Error") and not expanded_content.startswith("Failed"):
                        snippet = expanded_content
                        snippets.append(snippet)
               
                formatted_results.append({
                    'title': item.get('title', ''),
                    'link': item.get('link', ''),
                    'snippet': snippet,
                    'date': item_date_str,
                    'type': 'organic'
                })
       
        # Process news results
        if 'news' in results and results['news']:
            for item in results['news'][:3]:
                item_date_str = item.get('date')  
               
                snippet = item.get('snippet', '').strip()
 
                if snippet and len(snippet) < 100 and item.get('link'):
                    expanded_content = extract_webpage_content(item['link'])
                    if expanded_content and not expanded_content.startswith("Error") and not expanded_content.startswith("Failed"):
                        snippet = expanded_content
                        snippets.append(snippet)
               
                formatted_results.append({
                    'title': f"NEWS: {item.get('title', '')}",
                    'link': item.get('link', ''),
                    'snippet': snippet,
                    'date': item_date_str,
                    'source': item.get('source', ''),
                    'type': 'news'
                })        
        return snippets
   
    except requests.exceptions.RequestException as e:
        return [{"error": f"API Error: {str(e)}", "retry_after": "5 minutes"}]
    except json.JSONDecodeError:
        return [{"error": "Invalid API response format"}]
    except Exception as e:
        return [{"error": f"Unexpected error: {str(e)}"}]
 
web_search_tool = FunctionTool(
    func=search_web,
    name="search_web",
    description="""Searches the web for latest information based on the Indian banking sector.
    Includes both organic results and news articles. Use for:
    - Finding recent industry trends in banking
    - Validating factual claims
    - Getting updated statistics
    - Checking competitor activities
   
    Returns structured data with text snippet. Read through it and extract insightful information based on the query.
    """
)
 
sql_query_tool = FunctionTool(execute_sql, name="sql_query", description="Run SQL query/queries against the SQLite3 database")
content_extraction_tool = FunctionTool(extract_webpage_content, name="extract_webpage_content", description="Extract and summarize content from a specific webpage URL")
 
 
def  log_conversation_to_file(user_input, bot_response,  file_path="conversation_log.txt"):
       timestamp  = datetime.datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
       with  open(file_path, "a",  encoding="utf-8")  as  f:
             f.write(f"[{timestamp}]\nUser:  {user_input}\nAssistant:  {bot_response}\n\n")
 
user_proxy = ConversableAgent(
    name="Marketing_Manager",
    system_message="I am the creative marketing manager assistant who needs insights from our marketing SQLite database and wants to create effective marketing content.",
    code_execution_config=False,
    human_input_mode="TERMINATE"
)
 
with open("data_dictionary.txt", "r", encoding='utf-8') as file:
    data_dictionary = file.read()
 
input_validator = AssistantAgent(
    name="Input_Validator",
    system_message=f"""You are a validator expert for a banking marketing assistant.
    Your task is to determine if a user's query is related to banking data analysis or marketing content generation.
    Also if needed use the below data schema to determine if a user's query is related to banking data analysis or
    marketing content generation
    {data_dictionary}
    Approve queries that:
    - Explicitly mention banking/finance terms.
    - Only if there is atleast one banking term.
    - Strictly do not respond "UPDATE CONTEXT" or "Polite Rejection: ".
    - Ask to analyze banking data (like 'top performing categories').
    - Ask for insights from the banking database.
    - Ask for specific theme for only promoting banking products mentioned.
    - For approved queries, respond with: 'Valid banking query. Proceed.'
    - Asked about Customer Demographics, Geographical Demographics
    - If 'Current Input' and 'Context' are given.
    Note:
    -For rejected queries, decline politely and ask the user to input a banking domain related topic.
    -If the query contains disrespectful or inappropriate language or any topics not relevant to the banking sector of India respond to the user
    with a polite rejection and appropriate reason""",
    llm_config=get_llm_config("validator"),
    description="I am an expert in validating the user input, if the queries incline to the banking sector."
)
 
sql_expert = AssistantAgent(
    name="SQL_Expert",
    system_message=f"""You are a Database Management Systems expert, specializing in writing SQL queries for a SQLite database.
    Analyze the user's natural language input and translate it into a specific SQL query. Consider the following data schema with example values for each:
    {data_dictionary}
    Key relationships:
    - customer_data have multiple interactions
    - products_data are involved in multiple interactions
    - interactions are linked to channel_performance
    - interactions can lead to applications
    - applications table represents completed applications details
    When formulating queries:
    1. For customer behavior analysis:
       - Join interactions with customer_data and products_data for detailed insights.
       - Utilize fields like view_count, time_spent, and conversion_rate for engagement metrics.
       - event_list in interactions will have a list for each customer-product pair like ['view', 'start_application, 'applied']
   
    2. For channel performance:
       - Use the channel_performance table for detailed channel metrics.
       - Join channel_performance with interactions to link channel performance to specific customer interactions.
   
    3. To analyze application/purchase patterns:
       - Join applications with interactions, customer_data, and products_data for comprehensive analysis.
       - Analyze fields like application_date, application_amount, and fees_or_charges.
   
    4. For product performance and customer satisfaction:
       - Use the product_rating field in the applications table as a proxy for customer feedback.
       - Join applications with products_data to analyze product performance.
       - Aggregate product_rating by product to get overall satisfaction scores.
   
    5. For customer segmentation and profiling:
       - Utilize the rich customer data in the customer_data table (e.g., age, occupation, credit_score).
       - Combine with interaction data from interactions and application data from applications for behavioral segmentation.
    6. If you receive "UPDATE CONTEXT":
       - Check for the Current Input and generate SQL Query for that
    Remember to use appropriate JOIN operations when combining data from multiple tables, and consider using subqueries or CTEs for complex analyses. Always ensure that your queries are optimized for performance,
    never return more than 15 records.
    Only respond with the SQL query, without code notation and additional text. Ensure your query is tailored to extract the most relevant information based on the user's question.""",
    llm_config=get_llm_config("sql"),
    description="""I am an expert in creating SQL queries for SQL database designed for a digital marketing store.
    I have the data schema and relevant context required for generating queries""",
)
 
response_agent = AssistantAgent(
    name="response_agent",
    system_message="""You are an expert in data analysis and interpretation, specializing in indian banking, financial products, and digital marketing insights. Your primary task is to provide clear, insightful explanations of query results from a SQL database containing customer, product, channel, and application data for a banking institution.
    When interpreting query results, do the following if relevant data is available:
 
    1. Analyze Customer Behavior:
       - Identify patterns in customer interactions, product applications, and product ratings.
       - Consider demographics, credit scores, and their impact on financial behavior and product preferences.
 
    2. Interpret Customer Satisfaction:
       - Summarize overall customer satisfaction using product ratings from applications.
       - Link satisfaction to specific financial products, categories, or customer segments.
 
    3. Assess Application and Conversion Trends:
       - Analyze patterns in application submissions, approval rates, and time-to-application.
       - Evaluate conversion rates across different customer segments and channels.
       
    4. Info for segments:
       - Service Seekers: Characterized by users who engage with a variety of services, including international services, capital services, and digital services. They are likely interested in diverse service offerings that support business operations and financial management.
       - Scheme Beneficiaries: Primarily focused on government schemes and capital services. They may be businesses or individuals who benefit from financial programs and support mechanisms, such as MSME schemes, provided by the government.
       - Comprehensive Users: Involved with a broad range of financial products, such as loans, international services, capital services, digital services, and MSME schemes. They have comprehensive financial needs that span various aspects of financial management and investment.
       - Loan Seekers: Interested in loans and related financial products. They might be individuals or businesses looking for funding opportunities to support growth, manage expenses, or finance projects.
       - Digital Finance Users: Engage with digital services and government schemes. They are likely comfortable with technology-driven financial solutions and may use digital platforms for managing their financial activities and accessing government programs.
    5. Never say 'UPDATE CONTEXT'
    Provide your analysis in a clear, concise manner:
    - Highlight key trends, patterns, or anomalies in the banking and financial product data.
    - Present notable statistics or metrics with relevant context to the banking industry.
    - Offer actionable insights or recommendations based on the data, considering regulatory and risk management aspects.
    - Suggest potential areas for further investigation if applicable, especially regarding customer acquisition, retention, or cross-selling opportunities.
 
    Response suggestions:
    - Maintain a professional yet approachable tone. Currency should always by INR.
    - Do not greet the user and do not ask how can i assist you today.
    - Do not mention phrases like "from data fetched" or "based on the database".
    - For out of context or irrelevant questions, respond with a polite apology and state that you don't have the necessary information to answer accurately.
    - Remember you are responding to a marketing manager, do not include technical jargons like database and any other tools used.
    Tailor your response concisely to the specific user query and the data provided. Be comprehensive yet concise, avoiding unnecessary technical jargon. For simple queries, provide focused answers without extraneous information.""",
    llm_config=get_llm_config("response"),
    description="""I am an expert analyst, responsible for interpreting user query requirement and results from the database,
    and deliver coherent and insightful natural language responses back to the user."""
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
# Web Research Agent
web_researcher = AssistantAgent(
    name="Web_Researcher",
    system_message="""You are a digital marketing research expert who finds the latest trends, news, and information ONLY based on the Indian banking sector.
   
    When asked to research a topic:
    1. Formulate clear search queries related to digital marketing, trends, or specific Indian banking categories.
    2. Analyze search results and extract relevant information
    3. For particularly valuable sources, extract detailed content from specific webpages
    4. Summarize findings with focus on actionable marketing insights
    5. Highlight information that could be valuable for creating marketing content
    6. When out of context words like (pizza, origami) are encountered, extract insights in such a way that it could be used to promote a banking product, else do not retrieve anything.
   
    Always provide a structured summary of your findings with dates when available to ensure the information is current.
    Focus on information that will help create more effective and relevant marketing content. And do not mention any date before year 2025.
    If anything not related to banking or marketing is asked, apologize and reply politely that you can generate startegies for only banking related products.
    If you can't retrieve something or find any relevant data in the database, don't say anything. Just give empty result.
   
    Note: Do not include PNB or other bank name specifically. Change the name to National Bank if you have to.
    """,
    llm_config=get_llm_config("researcher"),
    description="I am an expert in fetching the latest data from the internet/web relevant to the user query."
)
 
web_researcher.register_for_llm(name="search_web", description="Search the web for information based on the Indian banking sector")(search_web)
web_researcher.register_for_llm(name="extract_webpage_content", description="Extract content from a webpage")(extract_webpage_content)
user_proxy.register_for_execution(name="search_web")(search_web)
user_proxy.register_for_execution(name="extract_webpage_content")(extract_webpage_content)
register_function(search_web, caller=web_researcher, executor=user_proxy, name="search_web", description="Search the web for information")
register_function(extract_webpage_content, caller=web_researcher, executor=user_proxy, name="web_content", description="Get webpage content")
 
content_creator = AssistantAgent(
    name="Content_Creator",
    system_message="""You are an expert digital marketing content creator specialized in crafting compelling marketing materials.
   
    Your capabilities:
    1. Create personalized email campaigns with engaging subject lines and body content
    2. Craft social media posts optimized for different platforms (Twitter, LinkedIn, Instagram, Facebook)
    3. Develop an advertisement with attention-grabbing headlines and clear calls to action
    4. Generate product descriptions, one-liners, and taglines that highlight unique selling points
    5. Add the themes to the contents, only if asked.
   
    When creating content:
    - Always adapt to the specific audience segments provided from the database
    - Incorporate current trends and insights from web research. If there are no results, do not mention those aspects.
    - Match the tone and style to our company the National Bank and campaign objectives. Ask to contact for more details - website: www.nationalbank.in; contact: 9999-8888-77
    - Consider the product features and benefits from the database
    - For out of context or irrelevant questions, respond with a humble apology and that you do not have the context.
 
    If a user asks for twitter content:
    - The content length should be STRICTLY under 200 characters.
    - Only give the content which can be direclty posted to twitter. Nothing else.
    - Use double quotes ONLY for the content.
   
    Response suggestions:
    - Optimize content length between 150-400 characters as suitable and structure for the intended platform.
    - Currency should always by INR.
    - Do not mention phrases like "from data fetched" or "based on the database".
    - Remember you are responding to a marketing manager, do not include technical jargons like SQL, database and any other tools used.
   
    For each content piece, provide few one liners explanation on why you think the response would be helpful.
 
    """,
    llm_config={"config_list": config_list, "temperature": 0.6},
    description="""I am an expert in generating the most interesting and catchy advertisements and branding content, using different platforms
    like social media, email, and more."""
)
 
group_chat = autogen.GroupChat(
    agents=[user_proxy,sql_expert, web_researcher, content_creator],
    messages=[],
    max_round=10,
    send_introductions=True
)
 
strategy_manager = autogen.GroupChatManager(
    groupchat=group_chat,
    llm_config={"config_list": config_list},
    system_message="""You are a head executive at the National Bank. When generating content responses,
    center it around for the National Bank and their potential customers. Do not include PNB or other bank name specifically.
    Change the name to National Bank if you have to. Ask to contact for more details - website: www.nationalbank.in; contact: 9999-8888-77;
    email id: nationalbank@example.com
 
    Workflow steps:
    1. Validate the query with Input_Validator.
    2. If validation fails, terminate the process and return the validation response.
    3. If validation succeeds, proceed with SQL_Expert, Web_Researcher, and Content_Creator.
    """
)

print("Strategy Manager initialized.")
 
@app.route('/')
def index():
  return send_from_directory(app.static_folder, 'index.html')
 
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    var = data.get('creds', "")
    print(var)
   
    return jsonify({"creds": "ok"})
 
@app.route('/campaign-strategy', methods=['POST'])
def marketing_content_workflow():
    data = request.get_json()
    user_request = data.get("product_name", "")
    requested_segment = data.get("segment", "")
 
    print(f"\nrequested_segment: {requested_segment}\n")
   
    validation_res = user_proxy.initiate_chat(
        input_validator,
        message=f"Is this query related to banking or financial services: {user_request}. Can this be used to market my existing banking products?",
        max_turns=1
    )
   
    last_message = validation_res.chat_history[-1]['content']
    if "valid banking query. proceed" in last_message.lower():
        res = user_proxy.initiate_chat(
            strategy_manager,
            message=f"""
            Understand the following query and generate suitable marketing content for the product - {user_request}.
   
            Please follow these steps:
            1. SQL_Expert: Analyze what database information we need and create appropriate queries to get relevant product, segment, or campaign information
            2. Web_Researcher: Find relevant current trends and information related to the request
            3. Content_Creator: Create the marketing content using insights from both the database and web research
   
            Let's work together to create effective marketing content.        
            """
        )
        content_creator_entries = [entry['content'] for entry in res.chat_history if entry.get('name') == "Content_Creator"]
        print(f"Content Creator entries: {content_creator_entries}")
        campaign_details = "\n".join(content_creator_entries)
        print(f"Campaign details:\n{campaign_details}")
        return jsonify({"response": campaign_details})
    else:
        return jsonify({"response": last_message})
 
chatbot_group_chat = autogen.GroupChat(
    agents=[user_proxy, sql_expert, response_agent],
    messages=[],
    max_round=7,
    send_introductions=True
)
 
chat_manager = autogen.GroupChatManager(
    groupchat=chatbot_group_chat,
    llm_config={"config_list": config_list},
    system_message="""
    You are managing the workflow for processing user queries related to banking and financial services.
   
    Workflow steps:
    1. Validate the query with Input_Validator.
    2. If validation fails, terminate the process and return the validation response.
    3. If validation succeeds, execute the SQL query using SQL_Expert.
    4. Once the SQL query is executed, pass the results to response_agent for interpretation.
    """
)
 
def reset_logs_and_temp():
    open("conversation_log.txt", "w").close()
 
@app.route('/reset', methods=['POST'])
def reset():
    reset_logs_and_temp()
    return {"status": "reset successful"}, 200
 
def  is_memory_available(path="conversation_log.txt"):
       return  os.path.exists(path) and  os.path.getsize(path)  >  0
 
@app.route('/chatbot',  methods=['POST'])
def  chat_assistant():
       data  = request.get_json()
       user_input  =  data.get("message",  "")
       if  not user_input:
               return jsonify({"response":  "No  input  received."})
       memory_assistant  = RetrieveUserProxyAgent(
       name="Memory_AI",
       system_message="You're a memory-empowered assistant helping with banking/marketing insights. Pull from past logs if helpful.",
      llm_config={"config_list":  config_list},
       retrieve_config={
              "task": "qa",
              "docs_path":  "conversation_log.txt",
              "get_or_create": False,
              "overwrite": True,
              "chunk_token_size": 100,
              "top_k": 5
             
       },
      code_execution_config={"use_docker":  False},
)
       if is_memory_available():
              result  =  memory_assistant.initiate_chat(chat_manager,message=memory_assistant.message_generator,problem=user_input)
              memory_response =  ""
              for  entry  in  result.chat_history:
                     if  entry.get("role")  ==  "assistant" or  entry.get("name")  ==  "Memory_AI":
                            memory_response  =  entry.get("content",  "")
                            break
              user_input = "Current Input: " + user_input + "Context: " +memory_response
       validation_res  =  user_proxy.initiate_chat(input_validator,message=user_input,max_turns=1)
       last_message  =  validation_res.chat_history[-1]['content']
       if  "valid banking query. proceed"  in  last_message.lower():
              res  =  user_proxy.initiate_chat(chat_manager, message=user_input,max_turns=2)
              analyst_entries  =  [entry['content']  for  entry  in res.chat_history  if  entry.get('name')=="response_agent"]
              final_response  =  "\n".join(analyst_entries)
              final_response = final_response.replace("UPDATE CONTEXT","")
              log_conversation_to_file("",  final_response)
              return  jsonify({"response": final_response})
       else:
               return jsonify({"response":  last_message})
   
@app.route('/post-to-twitter', methods=['POST'])
def tweet_route():
    data = request.json
    strategy = data.get('strategy')
 
    if strategy:
        try:
            tweet(strategy)
            return jsonify({"message": "Tweet posted successfully!"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "No strategy provided."}), 400
 
@app.route('/send-email', methods=['POST'])
def send_email_via_logic_app():
    data = request.get_json()
    to_email = data.get("toEmail", "")
    content = data.get("content", "")
    def parse_content_to_html(content):
        # Remove all occurrences of '#' from the content
        content = content.replace('#', '')
        lines = content.split('\n')
        html_content = []
        for line in lines:
            # Convert bold text using '*'
            line = line.replace('*', '<strong>').replace('*', '</strong>')
            html_content.append(f"<p>{line}</p>")
        return ''.join(html_content)
    parsed_content = parse_content_to_html(content)
    email_body_html = f"""
<html>
<head>
<style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            p {{
                font-size: 16px;
                margin-bottom: 10px;
            }}
            strong {{
                font-weight: bold;
            }}
</style>
</head>
<body>
<p><strong>Dear Recipient,</strong></p>
<p>Here is the strategy report generated for your campaign:</p>
        {parsed_content}
<p>Best regards,<br><strong>Your Marketing Team</strong></p>
<p>Contact information: [Your Email Address]</p>
</body>
</html>
    """
    payload = {
        "to_email": to_email,
        "subject": "Your Campaign Strategy Report",
        "email_body": email_body_html
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(LOGIC_APP_URL, json=payload, headers=headers)
        response.raise_for_status()
        return jsonify({"success": True, "message": "Email sent successfully via Logic App"})
    except requests.exceptions.RequestException as e:
        return jsonify({"success": False, "error": f"Failed to send email via Logic App. Error: {str(e)}"}), 500
    

#============================================DASHBOARD====================================================================
def get_db_connection():
    conn = sqlite3.connect(r'Database/bank_marketing_data.db')
    conn.row_factory = sqlite3.Row
    return conn
 
@app.route('/get-dashboard-data', methods=['GET'])
def summary_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    summary_stats_query = """
        SELECT
            (SELECT COUNT(*) FROM customer_data) AS totalCustomers,
            (SELECT COUNT(*) FROM products_data) AS totalProducts,
            (SELECT SUM(fees_or_charges) FROM applications) AS totalRevenue
    """
    cursor.execute(summary_stats_query)
    result = cursor.fetchone()
    segment_count_query = """
        SELECT segment_id, segment_name, COUNT(user_id) AS count
        FROM customer_segments
        GROUP BY segment_id, segment_name;
    """
    cursor.execute(segment_count_query)
    segment_count_results = cursor.fetchall()
    product_count_by_category_query = """
        SELECT category, COUNT(product_id) AS product_count
        FROM products_data
        GROUP BY category;
    """
    cursor.execute(product_count_by_category_query)
    product_count_by_category_results = cursor.fetchall()
 
    age_group_count_query = """
        SELECT
            CASE
                WHEN age < 18 THEN '<18'
                WHEN age >= 18 AND age < 25 THEN '18-24'
                WHEN age >= 25 AND age < 35 THEN '25-34'
                WHEN age >= 35 AND age < 45 THEN '35-44'
                WHEN age >= 45 AND age < 55 THEN '45-54'
                WHEN age >= 55 AND age < 65 THEN '55-64'
                ELSE '65+'
            END AS AgeGroup,
            COUNT(user_id) AS CustomerCount
        FROM
            customer_data
        GROUP BY
            AgeGroup
        ORDER BY
            AgeGroup;
    """
    cursor.execute(age_group_count_query)
    age_group_count_results = cursor.fetchall()
   
    applications_age_group_query = """
        SELECT
            CASE
                WHEN c.age < 18 THEN '<18'
                WHEN c.age >= 18 AND c.age < 25 THEN '18-24'
                WHEN c.age >= 25 AND c.age < 35 THEN '25-34'
                WHEN c.age >= 35 AND c.age < 45 THEN '35-44'
                WHEN c.age >= 45 AND c.age < 55 THEN '45-54'
                WHEN c.age >= 55 AND c.age < 65 THEN '55-64'
                ELSE '65+'
            END AS AgeGroup,
            COUNT(a.application_id) AS Applications
        FROM
            customer_data c
        JOIN
            applications a ON c.user_id = a.user_id
        GROUP BY
            AgeGroup
        ORDER BY
            AgeGroup;
    """
    cursor.execute(applications_age_group_query)
    applications_age_group_results = cursor.fetchall()
   
    channel_performance_query = """
        SELECT
            channel_id,
            channel_name,
            budget,
            application_revenue,
            clicks,
            impressions,
            cost_per_mille,
            click_through_rate_percentage,
            conversions,
            conversion_rate,
            return_on_ad_spend
        FROM channel_performance;
    """
    cursor.execute(channel_performance_query)
    channel_performance_results = cursor.fetchall()
    conn.close()
    data = {
        'summary_stats': {
            "totalCustomers": result['totalCustomers'],
            "totalProducts": result['totalProducts'],
            "totalRevenue": result['totalRevenue']
        },
        'customer_segmentation': [
            {
                "segment_id": row['segment_id'],
                "segment_name": row['segment_name'],
                "count": row['count']
            } for row in segment_count_results
        ],
         'product_count_by_category': [
            {
                "category": row['category'],
                "product_count": row['product_count']
            } for row in product_count_by_category_results
        ],
        'customer_age_distribution': [
            {
                "ageRange": row['AgeGroup'],
                "count": row['CustomerCount']
            } for row in age_group_count_results
        ],
        'age_vs_applications': [
            {
                "ageGroup": row['AgeGroup'],
                "applicationsCount": row['Applications']
            } for row in applications_age_group_results
        ],
        'channel_performance': [
            {
                "channel_id": row['channel_id'],
                "channel_name": row['channel_name'],
                "budget": row['budget'],
                "application_revenue": row['application_revenue'],
                "clicks": row['clicks'],
                "impressions": row['impressions'],
                "cost_per_mille": row['cost_per_mille'],
                "click_through_rate_percentage": row['click_through_rate_percentage'],
                "conversions": row['conversions'],
                "conversion_rate": row['conversion_rate'],
                "return_on_ad_spend": row['return_on_ad_spend']
            } for row in channel_performance_results
        ]
       
    }
 
    return jsonify(data)
 
@app.route('/get-filtered-data', methods=['GET'])
 
def get_filtered_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    channel_performance_query = """
        SELECT
            cp.channel_name,
            COUNT(i.interaction_id) AS channel_interactions,
            cp.cost_per_mille,
            cp.conversion_rate
        FROM
            channel_performance cp
        LEFT JOIN
            interactions i ON cp.channel_id = i.channel_id
        GROUP BY
            cp.channel_name, cp.cost_per_mille, cp.conversion_rate
        ORDER BY
            cp.channel_name;
    """
    cursor.execute(channel_performance_query)
    channel_performance_results = cursor.fetchall()
 
    age_segment_channel_query = """
        SELECT
            CASE
                WHEN c.age < 18 THEN '<18'
                WHEN c.age >= 18 AND c.age < 25 THEN '18-24'
                WHEN c.age >= 25 AND c.age < 35 THEN '25-34'
                WHEN c.age >= 35 AND c.age < 45 THEN '35-44'
                WHEN c.age >= 45 AND c.age < 55 THEN '45-54'
                WHEN c.age >= 55 AND c.age < 65 THEN '55-64'
                ELSE '65+'
            END AS AgeGroup,
            s.segment_name AS SegmentName,
            cp.channel_name AS ChannelName,
            COUNT(DISTINCT c.user_id) AS AgeGroupCount,
            COUNT(a.application_id) AS ApplicationsCount
        FROM
            customer_data c
        JOIN
            customer_segments s ON c.user_id = s.user_id
        JOIN
            interactions i ON c.user_id = i.user_id
        JOIN
            channel_performance cp ON i.channel_id = cp.channel_id
        JOIN
            applications a ON c.user_id = a.user_id
        GROUP BY
            AgeGroup, s.segment_name, cp.channel_name
        ORDER BY
            AgeGroup, s.segment_name, cp.channel_name;
    """
 
    cursor.execute(age_segment_channel_query)
    age_segment_channel_results = cursor.fetchall()
 
    category_channel_segment_applications_query = """
        SELECT
            p.category AS CategoryName,
            cp.channel_name AS ChannelName,
            s.segment_name AS SegmentName,
            CASE
                WHEN c.age < 18 THEN '<18'
                WHEN c.age >= 18 AND c.age < 25 THEN '18-24'
                WHEN c.age >= 25 AND c.age < 35 THEN '25-34'
                WHEN c.age >= 35 AND c.age < 45 THEN '35-44'
                WHEN c.age >= 45 AND c.age < 55 THEN '45-54'
                WHEN c.age >= 55 AND c.age < 65 THEN '55-64'
                ELSE '65+'
            END AS AgeGroup,
            COUNT(a.application_id) AS Applications,
            COUNT(DISTINCT c.user_id) AS AgeGroupCount
        FROM
            applications a
        JOIN
            interactions i ON a.interaction_id = i.interaction_id
        JOIN
            products_data p ON a.product_id = p.product_id
        JOIN
            channel_performance cp ON i.channel_id = cp.channel_id
        JOIN
            customer_segments s ON a.user_id = s.user_id
        JOIN
            customer_data c ON a.user_id = c.user_id
        GROUP BY
            p.category, cp.channel_name, s.segment_name, AgeGroup
        ORDER BY
            p.category, cp.channel_name, s.segment_name, AgeGroup;
    """
    cursor.execute(category_channel_segment_applications_query)
    category_channel_segment_applications_results = cursor.fetchall()
   
    unique_products_customers_fees_query = """
        SELECT
            cs.segment_name,
            cp.channel_name,
            COUNT(DISTINCT a.product_id) AS unique_products_applied,
            COUNT(DISTINCT c.user_id) AS total_customers,
            SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM
            applications a
        JOIN
            interactions i ON a.interaction_id = i.interaction_id
        JOIN
            customer_segments cs ON a.user_id = cs.user_id
        JOIN
            channel_performance cp ON i.channel_id = cp.channel_id
        JOIN
            customer_data c ON a.user_id = c.user_id
        GROUP BY
            cs.segment_name,
            cp.channel_name;
    """
    cursor.execute(unique_products_customers_fees_query)
    unique_products_customers_fees_results = cursor.fetchall()
   
    all_channels_vs_segments_query = """
        SELECT
            cs.segment_name,
            COUNT(DISTINCT c.user_id) AS total_customers,
            COUNT(DISTINCT a.product_id) AS unique_products,
            SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM
            applications a
        JOIN
            interactions i ON a.interaction_id = i.interaction_id
        JOIN
            customer_segments cs ON a.user_id = cs.user_id
        JOIN
            customer_data c ON a.user_id = c.user_id
        GROUP BY
            cs.segment_name;
    """
    cursor.execute(all_channels_vs_segments_query)
    all_channels_vs_segments_results = cursor.fetchall()
   
    all_segments_vs_channels_query = """
        SELECT
            cp.channel_name,
            COUNT(DISTINCT c.user_id) AS total_customers,
            COUNT(DISTINCT a.product_id) AS unique_products,
            SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM
            applications a
        JOIN
            interactions i ON a.interaction_id = i.interaction_id
        JOIN
            channel_performance cp ON i.channel_id = cp.channel_id
        JOIN
            customer_data c ON a.user_id = c.user_id
        GROUP BY
            cp.channel_name;
    """
    cursor.execute(all_segments_vs_channels_query)
    all_segments_vs_channels_results = cursor.fetchall()
    conn.close()
 
    data = {
        'channel_performance': [dict(row) for row in channel_performance_results],
        'AgeGroupData': [
            {
                "AgeGroup": row['AgeGroup'],
                "SegmentName": row['SegmentName'],
                "ChannelName": row['ChannelName'],
                "AgeGroupCount": row['AgeGroupCount'],
                "ApplicationsCount": row['ApplicationsCount']
            } for row in age_segment_channel_results
        ],
        'CategoryData': [
            {
                "CategoryName": row['CategoryName'],
                "ChannelName": row['ChannelName'],
                "SegmentName": row['SegmentName'],
                "Applications": row['Applications']
            } for row in category_channel_segment_applications_results
        ],
        'cardData': [
            {
                "SegmentName": row['segment_name'],
                "ChannelName": row['channel_name'],
                "UniqueProductsApplied": row['unique_products_applied'],
                "TotalCustomers": row['total_customers'],
                "TotalFeesOrCharges": row['total_fees_or_charges']
            } for row in unique_products_customers_fees_results
        ],
        'allChannelsVsSegments': [
            {
                "SegmentName": row['segment_name'],
                "TotalCustomers": row['total_customers'],
                "UniqueProducts": row['unique_products'],
                "TotalFeesOrCharges": row['total_fees_or_charges']
            } for row in all_channels_vs_segments_results
        ],
        'allSegmentsVsChannels': [
            {
                "ChannelName": row['channel_name'],
                "TotalCustomers": row['total_customers'],
                "UniqueProducts": row['unique_products'],
                "TotalFeesOrCharges": row['total_fees_or_charges']
            } for row in all_segments_vs_channels_results
        ],
    }
    return jsonify(data)

 
dashboard_summary_agent = AssistantAgent(
    name="Dashboard_Summary_Agent",
    system_message="""You are an expert data analyst specializing in providing concise insights and actionable recommendations based on banking marketing dashboards.
 
    When summarizing the dashboard data, do the following:
    1. Provide combined insights and recommendations in exactly five key points.
 
    Focus on:
    - Highlighting important trends and patterns along with actionable recommendations.
    - Noting significant changes or anomalies and suggesting improvements.
    - Identifying opportunities for growth or strategic actions succinctly.
 
    For the short version:
    - Summarize key insights and recommendations in under 15 words.
 
    For the long version:
    - Offer exactly five combined insights and recommendations.
 
    Always:
    - Use simple, non-technical language.
    - Reference amounts in INR where applicable.
    - Be precise with numbers.
    - Maintain a professional tone.
    - Avoid jargon like 'data shows' or 'according to the dashboard' or 'Long Summary of Insights and Recommendations:' Just give me the points.
    """,
    llm_config=get_llm_config("response"),
    description="I generate comprehensive summaries of dashboard data with actionable recommendations."
)
 
@app.route('/get-dashboard-summary', methods=['POST'])
def get_dashboard_summary():
    data = request.get_json()
    summary_type = data.get("type", "short")  
    card_data = data.get("data", {})
    context = {
        "summary_type": summary_type,
        "data": card_data
    }
 
    res = user_proxy.initiate_chat(
        dashboard_summary_agent,
        message=f"""Please provide a {summary_type} summary of this card data:
        {json.dumps(context, indent=2)}
        """,
        max_turns=1
    )
    summary = res.chat_history[-1]['content']
   
    return jsonify({
        "summary": summary,
        "type": summary_type
    })
 
 
if __name__ == '__main__':
    # final_check()
    app.run(debug=True, port = 5001)
    # app.run(host='0.0.0.0', port = 8000)
 
 
 
 
 