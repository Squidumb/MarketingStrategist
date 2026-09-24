"""Dashboard queries: intentionally plain SQL, not agentic — this is the 'rigid BI' side of the
app, kept separate so it's obvious which parts benefit from agents (campaign/chatbot) and which
don't (fixed, well-known aggregate reports)."""
from app.db.connection import get_db

_AGE_GROUP_CASE = """
    CASE
        WHEN {col} < 18 THEN '<18'
        WHEN {col} >= 18 AND {col} < 25 THEN '18-24'
        WHEN {col} >= 25 AND {col} < 35 THEN '25-34'
        WHEN {col} >= 35 AND {col} < 45 THEN '35-44'
        WHEN {col} >= 45 AND {col} < 55 THEN '45-54'
        WHEN {col} >= 55 AND {col} < 65 THEN '55-64'
        ELSE '65+'
    END
"""


def get_summary_stats() -> dict:
    db = get_db()
    result = db.run_query(
        """
        SELECT
            (SELECT COUNT(*) FROM customer_data) AS totalCustomers,
            (SELECT COUNT(*) FROM products_data) AS totalProducts,
            (SELECT SUM(fees_or_charges) FROM applications) AS totalRevenue
        """
    )[0]

    segments = db.run_query(
        """
        SELECT segment_id, segment_name, COUNT(user_id) AS count
        FROM customer_segments GROUP BY segment_id, segment_name
        """
    )
    product_categories = db.run_query(
        "SELECT category, COUNT(product_id) AS product_count FROM products_data GROUP BY category"
    )
    age_group = _AGE_GROUP_CASE.format(col="age")
    age_distribution = db.run_query(
        f"""
        SELECT {age_group} AS AgeGroup, COUNT(user_id) AS CustomerCount
        FROM customer_data GROUP BY AgeGroup ORDER BY AgeGroup
        """
    )
    age_group_c = _AGE_GROUP_CASE.format(col="c.age")
    age_vs_applications = db.run_query(
        f"""
        SELECT {age_group_c} AS AgeGroup, COUNT(a.application_id) AS Applications
        FROM customer_data c JOIN applications a ON c.user_id = a.user_id
        GROUP BY AgeGroup ORDER BY AgeGroup
        """
    )
    channel_performance = db.run_query(
        """
        SELECT channel_id, channel_name, budget, application_revenue, clicks, impressions,
               cost_per_mille, click_through_rate_percentage, conversions, conversion_rate,
               return_on_ad_spend
        FROM channel_performance
        """
    )

    return {
        "summary_stats": {
            "totalCustomers": result["totalCustomers"],
            "totalProducts": result["totalProducts"],
            "totalRevenue": result["totalRevenue"],
        },
        "customer_segmentation": segments,
        "product_count_by_category": product_categories,
        "customer_age_distribution": [
            {"ageRange": row["AgeGroup"], "count": row["CustomerCount"]} for row in age_distribution
        ],
        "age_vs_applications": [
            {"ageGroup": row["AgeGroup"], "applicationsCount": row["Applications"]} for row in age_vs_applications
        ],
        "channel_performance": channel_performance,
    }


def get_filtered_data() -> dict:
    db = get_db()
    channel_performance = db.run_query(
        """
        SELECT cp.channel_name, COUNT(i.interaction_id) AS channel_interactions,
               cp.cost_per_mille, cp.conversion_rate
        FROM channel_performance cp
        LEFT JOIN interactions i ON cp.channel_id = i.channel_id
        GROUP BY cp.channel_name, cp.cost_per_mille, cp.conversion_rate
        ORDER BY cp.channel_name
        """
    )

    age_group_c = _AGE_GROUP_CASE.format(col="c.age")
    age_segment_channel = db.run_query(
        f"""
        SELECT {age_group_c} AS AgeGroup, s.segment_name AS SegmentName, cp.channel_name AS ChannelName,
               COUNT(DISTINCT c.user_id) AS AgeGroupCount, COUNT(a.application_id) AS ApplicationsCount
        FROM customer_data c
        JOIN customer_segments s ON c.user_id = s.user_id
        JOIN interactions i ON c.user_id = i.user_id
        JOIN channel_performance cp ON i.channel_id = cp.channel_id
        JOIN applications a ON c.user_id = a.user_id
        GROUP BY AgeGroup, s.segment_name, cp.channel_name
        ORDER BY AgeGroup, s.segment_name, cp.channel_name
        """
    )

    category_channel_segment = db.run_query(
        """
        SELECT p.category AS CategoryName, cp.channel_name AS ChannelName, s.segment_name AS SegmentName,
               COUNT(a.application_id) AS Applications
        FROM applications a
        JOIN interactions i ON a.interaction_id = i.interaction_id
        JOIN products_data p ON a.product_id = p.product_id
        JOIN channel_performance cp ON i.channel_id = cp.channel_id
        JOIN customer_segments s ON a.user_id = s.user_id
        JOIN customer_data c ON a.user_id = c.user_id
        GROUP BY p.category, cp.channel_name, s.segment_name
        ORDER BY p.category, cp.channel_name, s.segment_name
        """
    )

    card_data = db.run_query(
        """
        SELECT cs.segment_name, cp.channel_name,
               COUNT(DISTINCT a.product_id) AS unique_products_applied,
               COUNT(DISTINCT c.user_id) AS total_customers,
               SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM applications a
        JOIN interactions i ON a.interaction_id = i.interaction_id
        JOIN customer_segments cs ON a.user_id = cs.user_id
        JOIN channel_performance cp ON i.channel_id = cp.channel_id
        JOIN customer_data c ON a.user_id = c.user_id
        GROUP BY cs.segment_name, cp.channel_name
        """
    )

    all_channels_vs_segments = db.run_query(
        """
        SELECT cs.segment_name, COUNT(DISTINCT c.user_id) AS total_customers,
               COUNT(DISTINCT a.product_id) AS unique_products, SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM applications a
        JOIN interactions i ON a.interaction_id = i.interaction_id
        JOIN customer_segments cs ON a.user_id = cs.user_id
        JOIN customer_data c ON a.user_id = c.user_id
        GROUP BY cs.segment_name
        """
    )

    all_segments_vs_channels = db.run_query(
        """
        SELECT cp.channel_name, COUNT(DISTINCT c.user_id) AS total_customers,
               COUNT(DISTINCT a.product_id) AS unique_products, SUM(a.fees_or_charges) AS total_fees_or_charges
        FROM applications a
        JOIN interactions i ON a.interaction_id = i.interaction_id
        JOIN channel_performance cp ON i.channel_id = cp.channel_id
        JOIN customer_data c ON a.user_id = c.user_id
        GROUP BY cp.channel_name
        """
    )

    return {
        "channel_performance": channel_performance,
        "AgeGroupData": age_segment_channel,
        "CategoryData": category_channel_segment,
        "cardData": [
            {
                "SegmentName": row["segment_name"],
                "ChannelName": row["channel_name"],
                "UniqueProductsApplied": row["unique_products_applied"],
                "TotalCustomers": row["total_customers"],
                "TotalFeesOrCharges": row["total_fees_or_charges"],
            }
            for row in card_data
        ],
        "allChannelsVsSegments": all_channels_vs_segments,
        "allSegmentsVsChannels": all_segments_vs_channels,
    }
