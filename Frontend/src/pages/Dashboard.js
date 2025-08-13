import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  FiBarChart2,
  FiBox,
  FiFilter,
  FiInfo,
  FiMenu,
  FiUser,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiTarget,
  FiZap,
  FiEye,
  FiMousePointer,
  FiPercent,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  ChartDataLabels
);

export default function Dashboard() {
  const [apiData, setApiData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [allChannels, setAllChannels] = useState([]);
  const [allSegments, setAllSegments] = useState([]);
  const [cardViews, setCardViews] = useState({
    segments: { activeTab: "chart", summary: "", type: "short", loading: false },
    products: { activeTab: "chart", summary: "", type: "short", loading: false },
    ageCount: { activeTab: "chart", summary: "", type: "short", loading: false },
    applicationCount: { activeTab: "chart", summary: "", type: "short", loading: false },
    engagement: { activeTab: "chart", summary: "", type: "short", loading: false },
    channelPerformance: { activeTab: "chart", summary: "", type: "short", loading: false },
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced chart options with dark theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#a1a1aa",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 12, family: "Inter" },
        },
      },
      datalabels: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#161616",
        titleColor: "#ffffff",
        bodyColor: "#a1a1aa",
        borderColor: "#27272a",
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: { family: "Inter", weight: "600" },
        bodyFont: { family: "Inter" },
      },
    },
    scales: {
      x: {
        ticks: { color: "#71717a", font: { family: "Inter" } },
        grid: { color: "#27272a", drawBorder: false },
        border: { display: false },
      },
      y: {
        ticks: { color: "#71717a", font: { family: "Inter" } },
        grid: { color: "#27272a", drawBorder: false },
        border: { display: false },
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#a1a1aa",
          boxWidth: 12,
          padding: 16,
          font: { size: 12, family: "Inter" },
          usePointStyle: true,
          generateLabels: (chart) => {
            return chart.data.labels.map((label, i) => ({
              text: `${label} years`,
              fillStyle: chart.data.datasets[0].backgroundColor[i],
              hidden: !chart.isDatasetVisible(0),
              index: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: "#161616",
        titleColor: "#ffffff",
        bodyColor: "#a1a1aa",
        borderColor: "#27272a",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    cutout: "70%",
  };

  // Data fetching logic (keeping original functionality)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5001/get-dashboard-data");
        const data = await response.json();
        setApiData(data);
        
        const dashboardChannels = data.channel_conversion_rate?.map((c) => c.channelName) || [];
        const dashboardSegments = data.customer_segmentation?.map((s) => s.segment_name) || [];
        
        setAllChannels((prev) => [...new Set([...prev, ...dashboardChannels])]);
        setAllSegments((prev) => [...new Set([...prev, ...dashboardSegments])]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5001/get-filtered-data?channel=${channelFilter}&segment=${segmentFilter}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFilteredData(data);
        
        const filteredChannels = data.AgeGroupData?.map((item) => item.ChannelName) || [];
        const filteredSegments = data.AgeGroupData?.map((item) => item.SegmentName) || [];
        
        setAllChannels((prev) => [...new Set([...prev, ...filteredChannels])]);
        setAllSegments((prev) => [...new Set([...prev, ...filteredSegments])]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [channelFilter, segmentFilter]);

  // Stats calculation (keeping original logic)
  const stats = channelFilter === "all" && segmentFilter === "all"
    ? [
        {
          title: "Total Customers",
          value: apiData?.summary_stats?.totalCustomers?.toLocaleString() || "0",
          icon: <FiUsers />,
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        },
        {
          title: "Active Campaigns",
          value: apiData?.summary_stats?.totalProducts?.toLocaleString() || "0",
          icon: <FiTarget />,
          gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        },
        {
          title: "Total Revenue",
          value: `₹${((apiData?.summary_stats?.totalRevenue || 0) / 10000000).toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`,
          icon: <FiDollarSign />,
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
      ]
    : [
        {
          title: "Total Customers",
          value: (() => {
            const data = filteredData?.AgeGroupData || [];
            let totalCustomers = 0;

            if (channelFilter !== "all" && segmentFilter !== "all") {
              totalCustomers = data
                .filter((item) => item.ChannelName === channelFilter && item.SegmentName === segmentFilter)
                .reduce((sum, item) => sum + (item.AgeGroupCount || 0), 0);
            } else if (channelFilter !== "all") {
              totalCustomers = data
                .filter((item) => item.ChannelName === channelFilter)
                .reduce((sum, item) => sum + (item.AgeGroupCount || 0), 0);
            } else if (segmentFilter !== "all") {
              totalCustomers = data
                .filter((item) => item.SegmentName === segmentFilter)
                .reduce((sum, item) => sum + (item.AgeGroupCount || 0), 0);
            }

            return totalCustomers.toLocaleString();
          })(),
          icon: <FiUsers />,
          change: "+5.2%",
          changeType: "positive",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        },
        {
          title: "Total Products",
          value: (() => {
            if (channelFilter !== "all" && segmentFilter !== "all") {
              return (filteredData?.cardData?.find((item) => item.ChannelName === channelFilter && item.SegmentName === segmentFilter)?.UniqueProductsApplied || 0).toLocaleString();
            } else if (channelFilter !== "all") {
              return (filteredData?.allSegmentsVsChannels?.find((item) => item.ChannelName === channelFilter)?.UniqueProducts || 0).toLocaleString();
            } else if (segmentFilter !== "all") {
              return (filteredData?.allChannelsVsSegments?.find((item) => item.SegmentName === segmentFilter)?.UniqueProducts || 0).toLocaleString();
            }
            return "0";
          })(),
          icon: <FiBox />,
          change: "+3.1%",
          changeType: "positive",
          gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        },
        {
          title: "Total Revenue",
          value: `₹${(() => {
            let totalRevenue = 0;
            if (channelFilter !== "all" && segmentFilter !== "all") {
              totalRevenue = filteredData?.cardData?.find((item) => item.ChannelName === channelFilter && item.SegmentName === segmentFilter)?.TotalFeesOrCharges || 0;
            } else if (channelFilter !== "all") {
              totalRevenue = filteredData?.allSegmentsVsChannels?.find((item) => item.ChannelName === channelFilter)?.TotalFeesOrCharges || 0;
            } else if (segmentFilter !== "all") {
              totalRevenue = filteredData?.allChannelsVsSegments?.find((item) => item.SegmentName === segmentFilter)?.TotalFeesOrCharges || 0;
            }
            return (totalRevenue / 10000000).toLocaleString(undefined, { maximumFractionDigits: 2 });
          })()} Cr`,
          icon: <FiDollarSign />,
          change: "+7.8%",
          changeType: "positive",
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
      ];

  // Chart data functions (keeping original logic)
  const getCustomerSegmentsData = () => {
    if (channelFilter !== "all" && segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const filtered = filteredData.AgeGroupData.filter(
        (item) => item.ChannelName === channelFilter && item.SegmentName === segmentFilter
      );

      const totalCustomers = filtered.reduce((sum, item) => sum + item.AgeGroupCount, 0);

      return {
        labels: [segmentFilter],
        datasets: [
          {
            label: `Customers (${channelFilter})`,
            data: [totalCustomers],
            backgroundColor: ["#3b82f6"],
            borderColor: ["#1d4ed8"],
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    }

    if (channelFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const segmentCounts = {};
      filteredData.AgeGroupData.forEach((item) => {
        if (item.ChannelName === channelFilter) {
          segmentCounts[item.SegmentName] = (segmentCounts[item.SegmentName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]);

      return {
        labels: sorted.map(([name]) => name),
        datasets: [
          {
            label: `Customers (${channelFilter})`,
            data: sorted.map(([_, count]) => count),
            backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
            borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"],
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    }

    if (segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const channelCounts = {};
      filteredData.AgeGroupData.forEach((item) => {
        if (item.SegmentName === segmentFilter) {
          channelCounts[item.ChannelName] = (channelCounts[item.ChannelName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);

      return {
        labels: sorted.map(([name]) => name),
        datasets: [
          {
            label: `Customers (${segmentFilter})`,
            data: sorted.map(([_, count]) => count),
            backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
            borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"],
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    }

    if (!apiData?.customer_segmentation) return { labels: [], datasets: [] };

    const sorted = [...apiData.customer_segmentation].sort((a, b) => b.count - a.count);

    return {
      labels: sorted.map((s) => s.segment_name),
      datasets: [
        {
          label: "Customer Count (All)",
          data: sorted.map((s) => s.count),
          backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
          borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  };

  const getFastMovingCategoriesData = () => {
    if (channelFilter !== "all" || segmentFilter !== "all") {
      if (!filteredData?.CategoryData) return { labels: [], datasets: [] };

      const categoryCounts = {};
      filteredData.CategoryData.forEach((item) => {
        if (
          (channelFilter === "all" || item.ChannelName === channelFilter) &&
          (segmentFilter === "all" || item.SegmentName === segmentFilter)
        ) {
          categoryCounts[item.CategoryName] = (categoryCounts[item.CategoryName] || 0) + item.Applications;
        }
      });

      const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

      return {
        labels: sorted.map(([name]) => name),
        datasets: [
          {
            label: `Applications (${segmentFilter !== "all" ? segmentFilter : "All"} ${channelFilter !== "all" ? channelFilter : ""})`,
            data: sorted.map(([_, count]) => count),
            backgroundColor: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
            borderColor: ["#7c3aed", "#1d4ed8", "#059669", "#d97706", "#dc2626"],
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    }

    if (!apiData?.product_count_by_category) return { labels: [], datasets: [] };

    const sorted = [...apiData.product_count_by_category].sort((a, b) => b.product_count - a.product_count).slice(0, 5);

    return {
      labels: sorted.map((item) => item.category),
      datasets: [
        {
          label: "Product Count (All)",
          data: sorted.map((item) => item.product_count),
          backgroundColor: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
          borderColor: ["#7c3aed", "#1d4ed8", "#059669", "#d97706", "#dc2626"],
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  };

  const getAgeData = () => {
    if (channelFilter === "all" && segmentFilter === "all") {
      return {
        labels: apiData?.customer_age_distribution?.map((d) => d.ageRange) || [],
        datasets: [
          {
            data: apiData?.customer_age_distribution?.map((d) => d.count) || [],
            backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
            borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
            borderWidth: 2,
          },
        ],
      };
    }

    const ageCounts = {};
    filteredData?.AgeGroupData?.forEach((item) => {
      const channelMatch = channelFilter === "all" || item.ChannelName === channelFilter;
      const segmentMatch = segmentFilter === "all" || item.SegmentName === segmentFilter;

      if (channelMatch && segmentMatch) {
        ageCounts[item.AgeGroup] = (ageCounts[item.AgeGroup] || 0) + item.AgeGroupCount;
      }
    });

    return {
      labels: Object.keys(ageCounts).sort(),
      datasets: [
        {
          data: Object.keys(ageCounts).sort().map((age) => ageCounts[age]),
          backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
          borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
          borderWidth: 2,
        },
      ],
    };
  };

  const getApplicationsCount = () => {
    if (channelFilter === "all" && segmentFilter === "all") {
      const data = apiData?.age_vs_applications || [];
      return {
        labels: data.map((d) => d.ageGroup),
        datasets: [
          {
            data: data.map((d) => d.applicationsCount),
            backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
            borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
            borderWidth: 2,
          },
        ],
      };
    }

    const timeSpent = {};
    filteredData?.AgeGroupData?.forEach((item) => {
      if (
        (channelFilter === "all" || item.ChannelName === channelFilter) &&
        (segmentFilter === "all" || item.SegmentName === segmentFilter)
      ) {
        const age = item.AgeGroup;
        timeSpent[age] = (timeSpent[age] || 0) + item.ApplicationsCount;
      }
    });

    return {
      labels: Object.keys(timeSpent).sort(),
      datasets: [
        {
          data: Object.values(timeSpent),
          backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
          borderColor: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
          borderWidth: 2,
        },
      ],
    };
  };

  const getChannelPerformanceData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    const sortedPerformance = apiData.channel_performance.sort((a, b) => b.application_revenue - a.application_revenue);

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          label: "Budget (₹)",
          data: sortedPerformance.map((c) => c.budget),
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 2,
          yAxisID: "y",
          order: 2,
          borderRadius: 6,
        },
        {
          label: "Revenue (₹)",
          data: sortedPerformance.map((c) => c.application_revenue),
          backgroundColor: "#8b5cf6",
          borderColor: "#7c3aed",
          borderWidth: 2,
          yAxisID: "y",
          order: 1,
          borderRadius: 6,
        },
        {
          type: "line",
          label: "ROAS (%)",
          data: sortedPerformance.map((c) => c.return_on_ad_spend),
          backgroundColor: "#10b981",
          borderColor: "#059669",
          borderWidth: 3,
          tension: 0.4,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#059669",
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const channelPerformanceOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: "bottom",
        labels: {
          ...chartOptions.plugins.legend.labels,
          usePointStyle: true,
          generateLabels: (chart) => {
            return chart.data.datasets.map((dataset, i) => {
              return {
                text: dataset.label,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.borderColor,
                lineWidth: dataset.borderWidth,
                pointStyle: dataset.type === "line" ? "line" : "rect",
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i,
              };
            });
          },
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Amount (₹)", color: "#71717a", font: { family: "Inter" } },
        ticks: { color: "#71717a", font: { family: "Inter" } },
        grid: { color: "#27272a", drawBorder: false },
        border: { display: false },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Percentage (%)", color: "#71717a", font: { family: "Inter" } },
        ticks: { color: "#71717a", font: { family: "Inter" } },
        grid: { drawOnChartArea: false },
        border: { display: false },
      },
    },
  };

  const getChannelEngagementData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    const sortedPerformance = apiData.channel_performance.sort((a, b) => b.clicks - a.clicks);

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          type: "bar",
          label: "Clicks",
          data: sortedPerformance.map((c) => c.clicks),
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 2,
          yAxisID: "y",
          order: 1,
          borderRadius: 6,
        },
        {
          type: "bar",
          label: "Impressions",
          data: sortedPerformance.map((c) => c.impressions),
          backgroundColor: "#8b5cf6",
          borderColor: "#7c3aed",
          borderWidth: 2,
          yAxisID: "y",
          order: 1,
          borderRadius: 6,
        },
        {
          type: "line",
          label: "CTR (%)",
          data: sortedPerformance.map((c) => c.click_through_rate_percentage),
          backgroundColor: "#10b981",
          borderColor: "#059669",
          borderWidth: 3,
          tension: 0.4,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#059669",
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          type: "line",
          label: "Conversion Rate (%)",
          data: sortedPerformance.map((c) => c.conversion_rate),
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
          borderWidth: 3,
          tension: 0.4,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#d97706",
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  // Summary request handler (keeping original logic)
  const handleSummaryRequest = async (cardKey, data, type = "short") => {
    setCardViews((prev) => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], loading: true, type },
    }));

    try {
      const response = await fetch("http://localhost:5001/get-dashboard-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, type, context: cardKey }),
      });
      const result = await response.json();

      setCardViews((prev) => ({
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          summary: result.summary.replace(/\*\*/g, ""),
          loading: false,
        },
      }));
    } catch (error) {
      console.error(`Error fetching ${cardKey} summary:`, error);
      setCardViews((prev) => ({
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          summary: "Failed to load summary. Please try again.",
          loading: false,
        },
      }));
    }
  };

  useEffect(() => {
    Object.keys(cardViews).forEach((cardKey) => {
      if (cardViews[cardKey].activeTab === "summary") {
        const getDataFunction = {
          segments: getCustomerSegmentsData,
          products: getFastMovingCategoriesData,
          ageCount: getAgeData,
          applicationCount: getApplicationsCount,
          engagement: getChannelEngagementData,
          channelPerformance: getChannelPerformanceData,
        }[cardKey];

        handleSummaryRequest(cardKey, getDataFunction(), cardViews[cardKey].type);
      }
    });
  }, [channelFilter, segmentFilter]);

  return (
    <div className="neo-dashboard">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`neo-main ${sidebarOpen ? "sidebar-expanded" : ""}`}>
        {/* Futuristic Header */}
        <header className="neo-header">
          <div className="neo-header-left">
            <button className="neo-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu />
            </button>
            <div className="neo-brand">
              <div className="neo-logo">
                <FiActivity />
              </div>
              <h1 className="neo-title">Analytics Command Center</h1>
            </div>
          </div>

          <div className="neo-header-right">
            <Link to="/chatbot" className={`neo-nav-link ${location.pathname === "/chatbot" ? "active" : ""}`}>
              <FiZap />
              <span>AI Assistant</span>
            </Link>

            <div className="neo-user-menu">
              <button className="neo-user-btn" onClick={() => setShowDropdown(!showDropdown)}>
                <FiUser />
              </button>

              {showDropdown && (
                <div className="neo-dropdown">
                  <button className="neo-dropdown-item" onClick={() => navigate("/")}>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="neo-content">
          {/* Advanced Filters */}
          <section className="neo-filters-section fade-in">
            <div className="neo-filter-card">
              <div className="neo-filter-header">
                <div className="neo-filter-icon">
                  <FiFilter />
                </div>
                <h3>Data Filters</h3>
              </div>
              
              <div className="neo-filter-controls">
                <div className="neo-select-group">
                  <label>Channel</label>
                  <select
                    className="neo-select"
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                  >
                    <option value="all">All Channels</option>
                    {allChannels.map((channel, index) => (
                      <option key={index} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="neo-select-group">
                  <label>Segment</label>
                  <select
                    className="neo-select"
                    value={segmentFilter}
                    onChange={(e) => setSegmentFilter(e.target.value)}
                  >
                    <option value="all">All Segments</option>
                    {allSegments.map((segment, index) => (
                      <option key={index} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Enhanced Stats Grid */}
          <section className="neo-stats-section fade-in">
            <div className="neo-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="neo-stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="neo-stat-icon" style={{ background: stat.gradient }}>
                    {stat.icon}
                  </div>
                  <div className="neo-stat-content">
                    <div className="neo-stat-value">{stat.value}</div>
                    <div className="neo-stat-title">{stat.title}</div>
                  </div>
                  <div className="neo-stat-glow"></div>
                </div>
              ))}
            </div>
          </section>

          {/* Demographics Section */}
          <section className="neo-section fade-in">
            <div className="neo-section-header">
              <h2 className="neo-section-title">
                <FiUsers />
                Demographic Intelligence
              </h2>
            </div>

            <div className="neo-charts-grid">
              {/* Customer Segments Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.segments.activeTab === "chart" ? "Customer Segments" : "Segments Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.segments.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          segments: { ...prev.segments, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.segments.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          segments: { ...prev.segments, activeTab: "summary" },
                        }));
                        if (!cardViews.segments.summary) {
                          handleSummaryRequest("segments", getCustomerSegmentsData(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.segments.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getCustomerSegmentsData().labels.length > 0 ? (
                        <Bar data={getCustomerSegmentsData()} options={chartOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiBarChart2 />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.segments.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.segments.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.segments.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("segments", getCustomerSegmentsData(), "short")}
                              disabled={cardViews.segments.loading}
                            >
                              {cardViews.segments.loading && cardViews.segments.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.segments.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("segments", getCustomerSegmentsData(), "long")}
                              disabled={cardViews.segments.loading}
                            >
                              {cardViews.segments.loading && cardViews.segments.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Categories Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.products.activeTab === "chart" ? "Top Product Categories" : "Product Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.products.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          products: { ...prev.products, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.products.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          products: { ...prev.products, activeTab: "summary" },
                        }));
                        if (!cardViews.products.summary) {
                          handleSummaryRequest("products", getFastMovingCategoriesData(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.products.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getFastMovingCategoriesData().labels.length > 0 ? (
                        <Bar data={getFastMovingCategoriesData()} options={chartOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiBox />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.products.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.products.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.products.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("products", getFastMovingCategoriesData(), "short")}
                              disabled={cardViews.products.loading}
                            >
                              {cardViews.products.loading && cardViews.products.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.products.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("products", getFastMovingCategoriesData(), "long")}
                              disabled={cardViews.products.loading}
                            >
                              {cardViews.products.loading && cardViews.products.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Age Distribution Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.ageCount.activeTab === "chart" ? "Age Distribution" : "Age Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.ageCount.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          ageCount: { ...prev.ageCount, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.ageCount.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          ageCount: { ...prev.ageCount, activeTab: "summary" },
                        }));
                        if (!cardViews.ageCount.summary) {
                          handleSummaryRequest("ageCount", getAgeData(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.ageCount.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getAgeData().labels.length > 0 ? (
                        <Doughnut data={getAgeData()} options={doughnutOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiUsers />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.ageCount.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.ageCount.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.ageCount.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("ageCount", getAgeData(), "short")}
                              disabled={cardViews.ageCount.loading}
                            >
                              {cardViews.ageCount.loading && cardViews.ageCount.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.ageCount.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("ageCount", getAgeData(), "long")}
                              disabled={cardViews.ageCount.loading}
                            >
                              {cardViews.ageCount.loading && cardViews.ageCount.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Application Count Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.applicationCount.activeTab === "chart" ? "Applications by Age" : "Application Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.applicationCount.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          applicationCount: { ...prev.applicationCount, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.applicationCount.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          applicationCount: { ...prev.applicationCount, activeTab: "summary" },
                        }));
                        if (!cardViews.applicationCount.summary) {
                          handleSummaryRequest("applicationCount", getApplicationsCount(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.applicationCount.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getApplicationsCount().labels.length > 0 ? (
                        <Doughnut data={getApplicationsCount()} options={doughnutOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiActivity />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.applicationCount.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.applicationCount.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.applicationCount.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("applicationCount", getApplicationsCount(), "short")}
                              disabled={cardViews.applicationCount.loading}
                            >
                              {cardViews.applicationCount.loading && cardViews.applicationCount.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.applicationCount.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("applicationCount", getApplicationsCount(), "long")}
                              disabled={cardViews.applicationCount.loading}
                            >
                              {cardViews.applicationCount.loading && cardViews.applicationCount.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Performance Section */}
          <section className="neo-section fade-in">
            <div className="neo-section-header">
              <h2 className="neo-section-title">
                <FiTarget />
                Performance Analytics
              </h2>
            </div>

            <div className="neo-charts-grid">
              {/* Financial Metrics Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.channelPerformance.activeTab === "chart" ? "Financial Metrics" : "Financial Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.channelPerformance.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          channelPerformance: { ...prev.channelPerformance, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.channelPerformance.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          channelPerformance: { ...prev.channelPerformance, activeTab: "summary" },
                        }));
                        if (!cardViews.channelPerformance.summary) {
                          handleSummaryRequest("channelPerformance", getChannelPerformanceData(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.channelPerformance.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getChannelPerformanceData().labels.length > 0 ? (
                        <Bar data={getChannelPerformanceData()} options={channelPerformanceOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiDollarSign />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.channelPerformance.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.channelPerformance.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.channelPerformance.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("channelPerformance", getChannelPerformanceData(), "short")}
                              disabled={cardViews.channelPerformance.loading}
                            >
                              {cardViews.channelPerformance.loading && cardViews.channelPerformance.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.channelPerformance.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("channelPerformance", getChannelPerformanceData(), "long")}
                              disabled={cardViews.channelPerformance.loading}
                            >
                              {cardViews.channelPerformance.loading && cardViews.channelPerformance.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement & Conversion Chart */}
              <div className="neo-chart-card">
                <div className="neo-chart-header">
                  <h3 className="neo-chart-title">
                    {cardViews.engagement.activeTab === "chart" ? "Engagement & Conversion" : "Engagement Analysis"}
                  </h3>
                  <div className="neo-chart-controls">
                    <button
                      className={`neo-toggle-btn ${cardViews.engagement.activeTab === "chart" ? "active" : ""}`}
                      onClick={() =>
                        setCardViews((prev) => ({
                          ...prev,
                          engagement: { ...prev.engagement, activeTab: "chart" },
                        }))
                      }
                    >
                      <FiBarChart2 />
                    </button>
                    <button
                      className={`neo-toggle-btn ${cardViews.engagement.activeTab === "summary" ? "active" : ""}`}
                      onClick={() => {
                        setCardViews((prev) => ({
                          ...prev,
                          engagement: { ...prev.engagement, activeTab: "summary" },
                        }));
                        if (!cardViews.engagement.summary) {
                          handleSummaryRequest("engagement", getChannelEngagementData(), "short");
                        }
                      }}
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>

                <div className="neo-chart-body">
                  {cardViews.engagement.activeTab === "chart" ? (
                    <div className="neo-chart-container">
                      {loading ? (
                        <div className="neo-loading">
                          <div className="neo-spinner"></div>
                          <p>Loading insights...</p>
                        </div>
                      ) : getChannelEngagementData().labels.length > 0 ? (
                        <Bar data={getChannelEngagementData()} options={channelPerformanceOptions} />
                      ) : (
                        <div className="neo-empty-state">
                          <FiMousePointer />
                          <p>No data available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="neo-summary-content">
                      {cardViews.engagement.loading ? (
                        <div className="neo-summary-loading">
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line"></div>
                          <div className="neo-skeleton-line short"></div>
                        </div>
                      ) : (
                        <>
                          <div className="neo-summary-text">
                            {cardViews.engagement.summary || "Click below to generate AI insights"}
                          </div>
                          <div className="neo-summary-actions">
                            <button
                              className={`neo-summary-btn ${cardViews.engagement.type === "short" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("engagement", getChannelEngagementData(), "short")}
                              disabled={cardViews.engagement.loading}
                            >
                              {cardViews.engagement.loading && cardViews.engagement.type === "short" ? "Analyzing..." : "Quick Summary"}
                            </button>
                            <button
                              className={`neo-summary-btn ${cardViews.engagement.type === "long" ? "active" : ""}`}
                              onClick={() => handleSummaryRequest("engagement", getChannelEngagementData(), "long")}
                              disabled={cardViews.engagement.loading}
                            >
                              {cardViews.engagement.loading && cardViews.engagement.type === "long" ? "Analyzing..." : "Deep Analysis"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
