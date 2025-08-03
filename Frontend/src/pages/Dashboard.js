import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  FiBarChart2,
  FiBox,
  FiFilter,
  FiInfo,
  FiMenu,
  FiUser,
} from "react-icons/fi";
import { Card, Col, Row, Dropdown, Modal, Button } from "react-bootstrap";
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
import MarwinLogo from "../assets/logo.png";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../Css_files/Dashboard.css";
import "../App.css";

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
    segments: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
    products: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
    ageCount: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
    applicationCount: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
    engagement: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
    channelPerformance: {
      activeTab: "chart",
      summary: "",
      type: "short",
      loading: false,
    },
  });

  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:5001/get-dashboard-data"
        );
        // const response = await fetch(
        //   "https://marwin-h5fwf2afhac5g4eu.eastus-01.azurewebsites.net/get-dashboard-data"
        // );

        const data = await response.json();

        setApiData(data);

        const dashboardChannels =
          data.channel_conversion_rate?.map((c) => c.channelName) || [];

        const dashboardSegments =
          data.customer_segmentation?.map((s) => s.segment_name) || [];

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
      console.log("Fetching filtered data...");

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5001/get-filtered-data?channel=${channelFilter}&segment=${segmentFilter}`
        );
        // const response = await fetch(
        //   `https://marwin-h5fwf2afhac5g4eu.eastus-01.azurewebsites.net/get-filtered-data?channel=${channelFilter}&segment=${segmentFilter}`
        // );

        console.log("Filtered data response received:", response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Filtered data:", data);

        setFilteredData(data);
        console.log("setFilterData done!!");
        const filteredChannels =
          data.AgeGroupData?.map((item) => item.ChannelName) || [];

        const filteredSegments =
          data.AgeGroupData?.map((item) => item.SegmentName) || [];

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
  console.log("segmentFilter", segmentFilter);
  const chartOptions = {
    responsive: true,

    plugins: {
      legend: {
        position: "bottom",

        labels: {
          color: "black",
        },
      },

      datalabels: {
        color: "black",

        anchor: "end",

        align: "top",

        formatter: (value) => value.toLocaleString(),
      },

      tooltip: {
        backgroundColor: " #0070c0",

        titleColor: "white",

        bodyColor: "white",

        borderColor: "white",

        borderWidth: 1,
      },
    },

    scales: {
      x: {
        ticks: {
          color: "black",
        },

        grid: {
          color: "rgba(200, 200, 200, 0.1)",
        },
      },

      y: {
        ticks: {
          color: "black",
        },

        grid: {
          color: "rgba(200, 200, 200, 0.1)",
        },
      },
    },
    layout: {
      padding: {
        top: 25,
      },
    },
  };

  const stats =
    channelFilter === "all" && segmentFilter === "all"
      ? [
          {
            title: "Total Customers",
            value: apiData?.summary_stats?.totalCustomers || 0,
            icon: <FiUser size={24} />,
            color: "#9c0033",
          },
          {
            title: "Total Products",
            value: apiData?.summary_stats?.totalProducts || 0,
            icon: <FiBox size={24} />,
            color: "#9c0033",
          },
          {
            title: "Total Revenue",
            value: `₹${(
              (apiData?.summary_stats?.totalRevenue || 0) / 10000000
            ).toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`,
            icon: <FiBarChart2 size={24} />,
            color: "#9c0033",
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
                  .filter(
                    (item) =>
                      item.ChannelName === channelFilter &&
                      item.SegmentName === segmentFilter
                  )
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

              return totalCustomers;
            })(),
            icon: <FiUser size={24} />,
            color: "#9c0033",
          },
          {
            title: "Total Products",
            value: (() => {
              if (channelFilter !== "all" && segmentFilter !== "all") {
                return (
                  filteredData?.cardData?.find(
                    (item) =>
                      item.ChannelName === channelFilter &&
                      item.SegmentName === segmentFilter
                  )?.UniqueProductsApplied || 0
                );
              } else if (channelFilter !== "all") {
                return (
                  filteredData?.allSegmentsVsChannels?.find(
                    (item) => item.ChannelName === channelFilter
                  )?.UniqueProducts || 0
                );
              } else if (segmentFilter !== "all") {
                return (
                  filteredData?.allChannelsVsSegments?.find(
                    (item) => item.SegmentName === segmentFilter
                  )?.UniqueProducts || 0
                );
              }
              return 0;
            })(),
            icon: <FiBox size={24} />,
            color: "#9c0033",
          },
          {
            title: "Total Revenue",
            value: `₹${(() => {
              let totalRevenue = 0;
              if (channelFilter !== "all" && segmentFilter !== "all") {
                totalRevenue =
                  filteredData?.cardData?.find(
                    (item) =>
                      item.ChannelName === channelFilter &&
                      item.SegmentName === segmentFilter
                  )?.TotalFeesOrCharges || 0;
              } else if (channelFilter !== "all") {
                totalRevenue =
                  filteredData?.allSegmentsVsChannels?.find(
                    (item) => item.ChannelName === channelFilter
                  )?.TotalFeesOrCharges || 0;
              } else if (segmentFilter !== "all") {
                totalRevenue =
                  filteredData?.allChannelsVsSegments?.find(
                    (item) => item.SegmentName === segmentFilter
                  )?.TotalFeesOrCharges || 0;
              }
              return (totalRevenue / 10000000).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              });
            })()} Cr`,
            icon: <FiBarChart2 size={24} />,
            color: "#9c0033",
          },
        ];

  const getCustomerSegmentsData = () => {
    if (channelFilter !== "all" && segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const filtered = filteredData.AgeGroupData.filter(
        (item) =>
          item.ChannelName === channelFilter &&
          item.SegmentName === segmentFilter
      );

      const totalCustomers = filtered.reduce(
        (sum, item) => sum + item.AgeGroupCount,
        0
      );

      return {
        labels: [segmentFilter],

        datasets: [
          {
            label: `Customers (${channelFilter})`,

            data: [totalCustomers],

            backgroundColor: "rgba(12, 176, 246, 0.7)",

            borderColor: "rgba(12, 176, 246, 0.7)",

            borderWidth: 1,
          },
        ],
      };
    }

    if (channelFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const segmentCounts = {};

      filteredData.AgeGroupData.forEach((item) => {
        if (item.ChannelName === channelFilter) {
          segmentCounts[item.SegmentName] =
            (segmentCounts[item.SegmentName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]);

      return {
        labels: sorted.map(([name]) => name),

        datasets: [
          {
            label: `Customers (${channelFilter})`,

            data: sorted.map(([_, count]) => count),

            backgroundColor: "rgba(12, 176, 246, 0.7)",

            borderColor: "rgba(12, 176, 246, 0.7)",

            borderWidth: 1,
          },
        ],
      };
    }

    if (segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const channelCounts = {};

      filteredData.AgeGroupData.forEach((item) => {
        if (item.SegmentName === segmentFilter) {
          channelCounts[item.ChannelName] =
            (channelCounts[item.ChannelName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);

      return {
        labels: sorted.map(([name]) => name),

        datasets: [
          {
            label: `Customers (${segmentFilter})`,

            data: sorted.map(([_, count]) => count),

            backgroundColor: "rgba(12, 176, 246, 0.7)",

            borderColor: "rgba(12, 176, 246, 0.7)",

            borderWidth: 1,
          },
        ],
      };
    }

    if (!apiData?.customer_segmentation) return { labels: [], datasets: [] };

    const sorted = [...apiData.customer_segmentation].sort(
      (a, b) => b.count - a.count
    );

    return {
      labels: sorted.map((s) => s.segment_name),

      datasets: [
        {
          label: "Customer Count (All)",

          data: sorted.map((s) => s.count),

          backgroundColor: "rgba(12, 176, 246, 0.7)",

          borderColor: "rgba(12, 176, 246, 0.7)",

          borderWidth: 1,
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
          categoryCounts[item.CategoryName] =
            (categoryCounts[item.CategoryName] || 0) + item.Applications;
        }
      });

      const sorted = Object.entries(categoryCounts)

        .sort((a, b) => b[1] - a[1])

        .slice(0, 5);

      return {
        labels: sorted.map(([name]) => name),

        datasets: [
          {
            label: `Applications (${
              segmentFilter !== "all" ? segmentFilter : "All"
            } ${channelFilter !== "all" ? channelFilter : ""})`,

            data: sorted.map(([_, count]) => count),

            backgroundColor: "rgba(12, 176, 246, 0.7)",

            borderColor: "rgba(12, 176, 246, 0.7)",

            borderWidth: 1,
          },
        ],
      };
    }

    if (!apiData?.product_count_by_category)
      return { labels: [], datasets: [] };

    const sorted = [...apiData.product_count_by_category]

      .sort((a, b) => b.product_count - a.product_count)

      .slice(0, 5);

    return {
      labels: sorted.map((item) => item.category),

      datasets: [
        {
          label: "Product Count (All)",

          data: sorted.map((item) => item.product_count),

          backgroundColor: "rgba(12, 176, 246, 0.7)",

          borderColor: "rgba(12, 176, 246, 0.7)",

          borderWidth: 1,
        },
      ],
    };
  };

  // 2. Smart Age Data Function
  const getAgeData = () => {
    // When no filters - use dashboard data
    if (channelFilter === "all" && segmentFilter === "all") {
      return {
        labels:
          apiData?.customer_age_distribution?.map((d) => d.ageRange) || [],
        datasets: [
          {
            data: apiData?.customer_age_distribution?.map((d) => d.count) || [],
            backgroundColor: [
              " #00d2ff",
              " #4bc0c0",
              " #ffa500",
              " #9966ff",
              " #ff6384",
              "rgb(253, 228, 5)",
            ],
          },
        ],
      };
    }

    // When filters applied - dynamic handling
    const ageCounts = {};

    filteredData?.AgeGroupData?.forEach((item) => {
      // Check channel filter
      const channelMatch =
        channelFilter === "all" || item.ChannelName === channelFilter;
      // Check segment filter
      const segmentMatch =
        segmentFilter === "all" || item.SegmentName === segmentFilter;

      if (channelMatch && segmentMatch) {
        ageCounts[item.AgeGroup] =
          (ageCounts[item.AgeGroup] || 0) + item.AgeGroupCount;
      }
    });

    return {
      labels: Object.keys(ageCounts).sort(),
      datasets: [
        {
          data: Object.keys(ageCounts)
            .sort()
            .map((age) => ageCounts[age]),
          backgroundColor: [
            " #00d2ff",
            " #4bc0c0",
            " #ffa500",
            " #9966ff",
            " #ff6384",
            "rgb(253, 228, 5)",
          ],
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "black", // Changed to a more visible color
          boxWidth: 12,
          padding: 16,
          font: {
            size: 12,
          },
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
        backgroundColor: " #0070c0", // Tooltip background color
        titleColor: "white",
        bodyColor: "white",
        borderColor: "white", // Border color for tooltip
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
      datalabels: {
        display: true,
        color: "black", // Changed to a more visible color
        formatter: (value) => value.toLocaleString(),
      },
    },
    cutout: "70%",
    layout: {
      padding: {
        left: 20,
        right: 20,
      },
    },
  };

  const getApplicationsCount = () => {
    // When no filters - use dashboard data
    if (channelFilter === "all" && segmentFilter === "all") {
      const data = apiData?.age_vs_applications || [];
      return {
        labels: data.map((d) => d.ageGroup),
        datasets: [
          {
            data: data.map((d) => d.applicationsCount), // Directly use applicationsCount
            backgroundColor: [
              " #00d2ff",
              " #4bc0c0",
              " #ffa500",
              " #9966ff",
              " #ff6384",
              "rgb(253, 228, 5)",
            ],
            borderWidth: 2,
          },
        ],
      };
    }

    // When filters applied
    const timeSpent = {};
    filteredData?.AgeGroupData?.forEach((item) => {
      if (
        (channelFilter === "all" || item.ChannelName === channelFilter) &&
        (segmentFilter === "all" || item.SegmentName === segmentFilter)
      ) {
        const age = item.AgeGroup;
        timeSpent[age] = (timeSpent[age] || 0) + item.ApplicationsCount; // Directly use ApplicationsCount
      }
    });

    return {
      labels: Object.keys(timeSpent).sort(),
      datasets: [
        {
          data: Object.values(timeSpent),
          backgroundColor: [
            " #00d2ff",
            " #4bc0c0",
            " #ffa500",
            " #9966ff",
            " #ff6384",
            "rgb(253, 228, 5)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getChannelData = () => {
    // When no filters - use dashboard data
    if (channelFilter === "all" && segmentFilter === "all") {
      const data = apiData?.channel_interactions || [];
      return {
        labels: data.map((item) => item.channel),
        datasets: [
          {
            data: data.map((item) => item.interactionCount),
            backgroundColor: "rgba(12, 176, 246, 0.7)",

            borderColor: "rgba(12, 176, 246, 0.7)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      };
    }

    // When filters applied - aggregate from AgeGroupData
    const channelInteractions = {};

    filteredData?.AgeGroupData?.forEach((item) => {
      const channel = item.ChannelName;
      const segment = item.SegmentName;

      // Check if matches current filters
      if (
        (channelFilter === "all" || channel === channelFilter) &&
        (segmentFilter === "all" || segment === segmentFilter)
      ) {
        channelInteractions[channel] =
          (channelInteractions[channel] || 0) + item.Interactions;
      }
    });

    // Convert to chart format and sort
    const sorted = Object.entries(channelInteractions)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({ channel, count }));

    return {
      labels: sorted.map((item) => item.channel),
      datasets: [
        {
          data: sorted.map((item) => item.count),
          backgroundColor: "rgba(12, 176, 246, 0.7)",

          borderColor: "rgba(12, 176, 246, 0.7)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const getChannelPerformanceData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    // Sort the channel_performance data by application_revenue in descending order
    const sortedPerformance = apiData.channel_performance.sort(
      (a, b) => b.application_revenue - a.application_revenue
    );

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          label: "Budget (₹)",
          data: sortedPerformance.map((c) => c.budget),
          backgroundColor: "rgba(12, 176, 246, 0.7)",
          borderColor: "rgba(12, 176, 246, 0.7)",
          borderWidth: 1,
          yAxisID: "y",
          order: 2,
        },
        {
          label: "Revenue (₹)",
          data: sortedPerformance.map((c) => c.application_revenue),
          backgroundColor: "rgba(12, 71, 246, 0.7)",
          borderColor: "rgba(12, 176, 246, 0.7)",
          borderWidth: 1,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "line",
          label: "ROAS (%)",
          data: sortedPerformance.map((c) => c.return_on_ad_spend),
          backgroundColor: "rgba(156, 0, 51, 0.7)",
          borderColor: "rgba(156, 0, 52, 0.8)",
          borderWidth: 2,
          tension: 0.1,
          yAxisID: "y1",
          order: 0,
        },
      ],
    };
  };

  const channelPerformanceOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      datalabels: {
        color: "#000000",
        font: {
          size: 10,
        },
        display: (context) => {
          const datasetType = context.dataset.type;
          return datasetType === "line";
        },
        anchor: "end",
        align: "top",
        offset: 4,
      },
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
        title: {
          display: true,
          text: "Count",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Percentage (%)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    layout: {
      padding: {
        top: 20,
      },
    },
  };

  const getChannelEngagementData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    // Sort the channel_performance data by clicks in descending order
    const sortedPerformance = apiData.channel_performance.sort(
      (a, b) => b.clicks - a.clicks
    );

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          type: "bar",
          label: "Clicks",
          data: sortedPerformance.map((c) => c.clicks),
          backgroundColor: "rgba(12, 176, 246, 0.7)",
          borderColor: "rgba(12, 176, 246, 0.7)",
          borderWidth: 1,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "bar",
          label: "Impressions",
          data: sortedPerformance.map((c) => c.impressions),
          backgroundColor: "rgba(12, 71, 246, 0.7)",
          borderColor: "rgba(12, 176, 246, 0.7)",
          borderWidth: 1,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "line",
          label: "CTR (%)",
          data: sortedPerformance.map((c) => c.click_through_rate_percentage),
          backgroundColor: "rgba(23, 0, 156, 0.7)",
          borderColor: "rgba(156, 0, 52, 0.8)",
          borderWidth: 2,
          tension: 0.1,
          yAxisID: "y1",
          order: 0,
        },
        {
          type: "line",
          label: "Conversion Rate (%)",
          data: sortedPerformance.map((c) => c.conversion_rate),
          backgroundColor: "rgba(246, 173, 12, 0.7)",
          borderColor: "rgba(246, 173, 12, 1)",
          borderWidth: 2,
          tension: 0.1,
          yAxisID: "y1",
          order: 0,
        },
      ],
    };
  };

  console.log("Going to return phase");

  const handleSummaryRequest = async (cardKey, data, type = "short") => {
    setCardViews((prev) => ({
      ...prev,
      [cardKey]: {
        ...prev[cardKey],
        loading: true,
        type,
      },
    }));

    try {
      const response = await fetch(
        "http://localhost:5001/get-dashboard-summary",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            type,
            context: cardKey,
          }),
        }
      );
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
          channelPerformace: getChannelPerformanceData,
        }[cardKey];

        handleSummaryRequest(
          cardKey,
          getDataFunction(),
          cardViews[cardKey].type
        );
      }
    });
  }, [channelFilter, segmentFilter]);

  return (
    <div className="dashboard-container">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div
        className="main-content"
        style={{ marginLeft: sidebarOpen ? "250px" : "0" }}
      >
        <header className="dashboard-header">
          <div className="header-left" style={{ marginRight: "auto" }}>
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu size={30} />
            </button>
          </div>

          <div
            className="header-center"
            style={{
              position: "absolute",

              left: sidebarOpen ? "calc(50% + 120px)" : "50%",

              transform: "translateX(-50%)",

              fontFamily: "'Montserrat', sans-serif",

              fontWeight: 600,

              letterSpacing: "1px",

              transition: "left 0.3s ease",
            }}
          >
            <img src={MarwinLogo} alt="Marwin Logo" className="logo" />
          </div>

          <div className="header-actions">
            <Link
              to="/dashboard"
              className={`link-button ${
                location.pathname === "/dashboard" ? "active" : ""
              }`}
            >
              Dashboard
            </Link>

            <div className="user-dropdown">
              <button
                className="user-profile"
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  console.log("Dropdown state:", showDropdown);
                }}
              >
                <FiUser size={23} />
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: "2rem",
                    background: "#ffffff",
                    border: "1px solid rgba(28, 89, 194, 0.3)",
                    borderRadius: "8px",
                    padding: "0.5rem 0",
                    minWidth: "160px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "#1c59c2",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: "0.85rem",
                      transition: "background-color 0.3s ease, color 0.3s ease",
                    }}
                    onClick={() => navigate("/")}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "rgba(28, 89, 194, 0.1)";
                      e.target.style.color = "#0e1013";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "none";
                      e.target.style.color = "#1c59c2";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-header">
            <h2>Marketing Dashboard</h2>
          </div>

          <Row className="mb-4">
            <Col md={12}>
              <Card className="filter-card">
                <Card.Body>
                  <div className="filter-section">
                    <div className="filter-group">
                      <span className="filter-label">
                        <FiFilter size={18} className="me-2" />
                        Filter by:
                      </span>

                      <Dropdown className="ms-3 me-3">
                        <Dropdown.Toggle
                          variant="outline-primary"
                          id="channel-filter"
                        >
                          Channel:{" "}
                          {channelFilter === "all"
                            ? "All Channels"
                            : channelFilter}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => setChannelFilter("all")}
                          >
                            All Channels
                          </Dropdown.Item>

                          {allChannels.map((channel, index) => (
                            <Dropdown.Item
                              key={index}
                              onClick={() => setChannelFilter(channel)}
                              active={channelFilter === channel}
                            >
                              {channel}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>

                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-primary"
                          id="segment-filter"
                        >
                          Segment:{" "}
                          {segmentFilter === "all"
                            ? "All Segments"
                            : segmentFilter}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => setSegmentFilter("all")}
                          >
                            All Segments
                          </Dropdown.Item>

                          {allSegments.map((segment, index) => (
                            <Dropdown.Item
                              key={index}
                              onClick={() => setSegmentFilter(segment)}
                              active={segmentFilter === segment}
                            >
                              {segment}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            {stats.map((stat, index) => (
              <Col key={index} md={4}>
                <Card
                  className="stat-card"
                  style={{ borderLeft: `4px solid ${stat.color}` }}
                >
                  <Card.Body>
                    <div className="stat-content">
                      <div
                        className="stat-icon"
                        style={{
                          background: `${stat.color}20`,

                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div className="stat-text">
                        <h6>{stat.title}</h6>
                        <h3>{stat.value}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <h3 className="page-header" style={{ color: " #001f3f" }}>
                Demographic Analysis
              </h3>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.segments.activeTab === "chart"
                        ? "Customer Segments"
                        : "Customer Segments Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.segments.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            segments: {
                              ...prev.segments,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.segments.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            segments: {
                              ...prev.segments,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.segments.summary) {
                            handleSummaryRequest(
                              "segments",
                              getCustomerSegmentsData(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>

                  {cardViews.segments.activeTab === "chart" ? (
                    <div className="chart-container">
                      {loading ? (
                        <div className="loading-chart">Loading data...</div>
                      ) : getCustomerSegmentsData().labels.length > 0 ? (
                        <Bar
                          data={getCustomerSegmentsData()}
                          options={chartOptions}
                        />
                      ) : (
                        <div className="empty-chart">No data available</div>
                      )}
                    </div>
                  ) : (
                    <div className="summary-tab-content">
                      {cardViews.segments.loading ? (
                        <div className="summary-skeleton">
                          <div className="skeleton-line"></div>
                          <div className="skeleton-line"></div>
                          <div
                            className="skeleton-line"
                            style={{ width: "80%" }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <div className="summary-content-container">
                            <div className="summary-content">
                              {cardViews.segments.summary ||
                                "Click below to generate insights"}
                            </div>
                          </div>
                          <div className="summary-buttons">
                            <Button
                              variant={
                                cardViews.segments.type === "short"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "segments",
                                  getCustomerSegmentsData(),
                                  "short"
                                )
                              }
                              disabled={cardViews.segments.loading}
                            >
                              {cardViews.segments.loading &&
                              cardViews.segments.type === "short"
                                ? "Generating..."
                                : "Quick Summary"}
                            </Button>
                            <Button
                              variant={
                                cardViews.segments.type === "long"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "segments",
                                  getCustomerSegmentsData(),
                                  "long"
                                )
                              }
                              disabled={cardViews.segments.loading}
                            >
                              {cardViews.segments.loading &&
                              cardViews.segments.type === "long"
                                ? "Generating..."
                                : "Detailed Analysis"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.products.activeTab === "chart"
                        ? "Frequently Subscribed Product Categories"
                        : "Product Categories Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.products.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            products: {
                              ...prev.products,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.products.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            products: {
                              ...prev.products,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.products.summary) {
                            handleSummaryRequest(
                              "products",
                              getFastMovingCategoriesData(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>

                  {cardViews.products.activeTab === "chart" ? (
                    <div className="chart-container">
                      {loading ? (
                        <div className="loading-chart">Loading data...</div>
                      ) : getFastMovingCategoriesData().labels.length > 0 ? (
                        <Bar
                          data={getFastMovingCategoriesData()}
                          options={chartOptions}
                        />
                      ) : (
                        <div className="empty-chart">No data available</div>
                      )}
                    </div>
                  ) : (
                    <div className="summary-tab-content">
                      {cardViews.products.loading ? (
                        <div className="summary-skeleton">
                          <div className="skeleton-line"></div>
                          <div className="skeleton-line"></div>
                          <div
                            className="skeleton-line"
                            style={{ width: "80%" }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <div className="summary-content-container">
                            <div className="summary-content">
                              {cardViews.products.summary ||
                                "Click below to generate insights"}
                            </div>
                          </div>
                          <div className="summary-buttons">
                            <Button
                              variant={
                                cardViews.products.type === "short"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "products",
                                  getFastMovingCategoriesData(),
                                  "short"
                                )
                              }
                              disabled={cardViews.products.loading}
                            >
                              {cardViews.products.loading &&
                              cardViews.products.type === "short"
                                ? "Generating..."
                                : "Quick Summary"}
                            </Button>
                            <Button
                              variant={
                                cardViews.products.type === "long"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "products",
                                  getFastMovingCategoriesData(),
                                  "long"
                                )
                              }
                              disabled={cardViews.products.loading}
                            >
                              {cardViews.products.loading &&
                              cardViews.products.type === "long"
                                ? "Generating..."
                                : "Detailed Analysis"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.ageCount.activeTab === "chart"
                        ? "Customer Age Distribution"
                        : "Customer Age Distribution Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.ageCount.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            ageCount: {
                              ...prev.ageCount,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.ageCount.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            ageCount: {
                              ...prev.ageCount,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.ageCount.summary) {
                            handleSummaryRequest(
                              "ageCount",
                              getAgeData(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>

                  <div>
                    {cardViews.ageCount.activeTab === "chart" ? (
                      <div
                        style={{
                          height: "300px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {loading ? (
                          <div className="text-muted">Loading age data...</div>
                        ) : getAgeData().labels.length > 0 ? (
                          <div style={{ width: "100%", height: "100%" }}>
                            <Doughnut
                              data={getAgeData()}
                              options={doughnutOptions}
                            />
                          </div>
                        ) : (
                          <div className="text-muted">
                            No data for current filters
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="summary-tab-content">
                        {cardViews.ageCount.loading ? (
                          <div className="summary-skeleton">
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line"></div>
                            <div
                              className="skeleton-line"
                              style={{ width: "80%" }}
                            ></div>
                          </div>
                        ) : (
                          <>
                            <div className="summary-content-container">
                              <div className="summary-content">
                                {cardViews.ageCount.summary ||
                                  "Click below to generate insights"}
                              </div>
                            </div>
                            <div className="summary-buttons">
                              <Button
                                variant={
                                  cardViews.ageCount.type === "short"
                                    ? "primary"
                                    : "outline-primary"
                                }
                                onClick={() =>
                                  handleSummaryRequest(
                                    "ageCount",
                                    getAgeData(),
                                    "short"
                                  )
                                }
                                disabled={cardViews.ageCount.loading}
                              >
                                {cardViews.ageCount.loading &&
                                cardViews.ageCount.type === "short"
                                  ? "Generating..."
                                  : "Quick Summary"}
                              </Button>
                              <Button
                                variant={
                                  cardViews.ageCount.type === "long"
                                    ? "primary"
                                    : "outline-primary"
                                }
                                onClick={() =>
                                  handleSummaryRequest(
                                    "ageCount",
                                    getAgeData(),
                                    "long"
                                  )
                                }
                                disabled={cardViews.ageCount.loading}
                              >
                                {cardViews.ageCount.loading &&
                                cardViews.ageCount.type === "long"
                                  ? "Generating..."
                                  : "Detailed Analysis"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.applicationCount.activeTab === "chart"
                        ? "Application Count by Age"
                        : "Application Count by Age Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.applicationCount.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            applicationCount: {
                              ...prev.applicationCount,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.applicationCount.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            applicationCount: {
                              ...prev.applicationCount,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.applicationCount.summary) {
                            handleSummaryRequest(
                              "applicationCount",
                              getApplicationsCount(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>

                  <div>
                    {cardViews.applicationCount.activeTab === "chart" ? (
                      <div
                        style={{
                          height: "300px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {loading ? (
                          <div className="text-muted">
                            Loading application count data...
                          </div>
                        ) : getApplicationsCount().labels.length > 0 ? (
                          <div style={{ width: "100%", height: "100%" }}>
                            <Doughnut
                              data={getApplicationsCount()}
                              options={doughnutOptions}
                            />
                          </div>
                        ) : (
                          <div className="text-muted">
                            No data for current filters
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="summary-tab-content">
                        {cardViews.applicationCount.loading ? (
                          <div className="summary-skeleton">
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line"></div>
                            <div
                              className="skeleton-line"
                              style={{ width: "80%" }}
                            ></div>
                          </div>
                        ) : (
                          <>
                            <div className="summary-content-container">
                              <div className="summary-content">
                                {cardViews.applicationCount.summary ||
                                  "Click below to generate insights"}
                              </div>
                            </div>
                            <div className="summary-buttons">
                              <Button
                                variant={
                                  cardViews.applicationCount.type === "short"
                                    ? "primary"
                                    : "outline-primary"
                                }
                                onClick={() =>
                                  handleSummaryRequest(
                                    "applicationCount",
                                    getApplicationsCount(),
                                    "short"
                                  )
                                }
                                disabled={cardViews.applicationCount.loading}
                              >
                                {cardViews.applicationCount.loading &&
                                cardViews.applicationCount.type === "short"
                                  ? "Generating..."
                                  : "Quick Summary"}
                              </Button>
                              <Button
                                variant={
                                  cardViews.applicationCount.type === "long"
                                    ? "primary"
                                    : "outline-primary"
                                }
                                onClick={() =>
                                  handleSummaryRequest(
                                    "applicationCount",
                                    getApplicationsCount(),
                                    "long"
                                  )
                                }
                                disabled={cardViews.applicationCount.loading}
                              >
                                {cardViews.applicationCount.loading &&
                                cardViews.applicationCount.type === "long"
                                  ? "Generating..."
                                  : "Detailed Analysis"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={12}>
              <h3 className="page-header" style={{ color: "#001f3f" }}>
                Channel Performance
              </h3>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.channelPerformance.activeTab === "chart"
                        ? "Financial Metrics"
                        : "Financial Metrics Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.channelPerformance.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            channelPerformance: {
                              ...prev.channelPerformance,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.channelPerformance.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            channelPerformance: {
                              ...prev.channelPerformance,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.channelPerformance.summary) {
                            handleSummaryRequest(
                              "channelPerformance",
                              getChannelPerformanceData(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>
                  {cardViews.channelPerformance.activeTab === "chart" ? (
                    <div className="chart-container">
                      {loading ? (
                        <div className="loading-chart">Loading data...</div>
                      ) : getChannelPerformanceData().labels.length > 0 ? (
                        <Bar
                          data={getChannelPerformanceData()}
                          options={channelPerformanceOptions}
                        />
                      ) : (
                        <div className="empty-chart">No data available</div>
                      )}
                    </div>
                  ) : (
                    <div className="summary-tab-content">
                      {cardViews.channelPerformance.loading ? (
                        <div className="summary-skeleton">
                          <div className="skeleton-line"></div>
                          <div className="skeleton-line"></div>
                          <div
                            className="skeleton-line"
                            style={{ width: "80%" }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <div className="summary-content-container">
                            <div className="summary-content">
                              {cardViews.channelPerformance.summary ||
                                "Click below to generate insights"}
                            </div>
                          </div>
                          <div className="summary-buttons">
                            <Button
                              variant={
                                cardViews.channelPerformance.type === "short"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "channelPerformance",
                                  getChannelPerformanceData(),
                                  "short"
                                )
                              }
                              disabled={cardViews.channelPerformance.loading}
                            >
                              {cardViews.channelPerformance.loading &&
                              cardViews.channelPerformance.type === "short"
                                ? "Generating..."
                                : "Quick Summary"}
                            </Button>
                            <Button
                              variant={
                                cardViews.channelPerformance.type === "long"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "channelPerformance",
                                  getChannelPerformanceData(),
                                  "long"
                                )
                              }
                              disabled={cardViews.channelPerformance.loading}
                            >
                              {cardViews.channelPerformance.loading &&
                              cardViews.channelPerformance.type === "long"
                                ? "Generating..."
                                : "Detailed Analysis"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-header">
                    <h5>
                      {cardViews.engagement.activeTab === "chart"
                        ? "Engagement & Conversion"
                        : "Engagement & Conversion Summary"}
                    </h5>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${
                          cardViews.engagement.activeTab === "chart"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCardViews((prev) => ({
                            ...prev,
                            engagement: {
                              ...prev.engagement,
                              activeTab: "chart",
                            },
                          }))
                        }
                      >
                        <FiBarChart2 />
                      </button>
                      <button
                        className={`view-toggle-btn ${
                          cardViews.engagement.activeTab === "summary"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setCardViews((prev) => ({
                            ...prev,
                            engagement: {
                              ...prev.engagement,
                              activeTab: "summary",
                            },
                          }));
                          if (!cardViews.engagement.summary) {
                            handleSummaryRequest(
                              "engagement",
                              getChannelPerformanceData(),
                              "short"
                            );
                          }
                        }}
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </div>
                  {cardViews.engagement.activeTab === "chart" ? (
                    <div className="chart-container">
                      {loading ? (
                        <div className="loading-chart">Loading data...</div>
                      ) : getChannelEngagementData().labels.length > 0 ? (
                        <Bar
                          data={getChannelEngagementData()}
                          options={channelPerformanceOptions}
                        />
                      ) : (
                        <div className="empty-chart">No data available</div>
                      )}
                    </div>
                  ) : (
                    <div className="summary-tab-content">
                      {cardViews.engagement.loading ? (
                        <div className="summary-skeleton">
                          <div className="skeleton-line"></div>
                          <div className="skeleton-line"></div>
                          <div
                            className="skeleton-line"
                            style={{ width: "80%" }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <div className="summary-content-container">
                            <div className="summary-content">
                              {cardViews.engagement.summary ||
                                "Click below to generate insights"}
                            </div>
                          </div>
                          <div className="summary-buttons">
                            <Button
                              variant={
                                cardViews.engagement.type === "short"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "engagement",
                                  getChannelEngagementData(),
                                  "short"
                                )
                              }
                              disabled={cardViews.engagement.loading}
                            >
                              {cardViews.engagement.loading &&
                              cardViews.engagement.type === "short"
                                ? "Generating..."
                                : "Quick Summary"}
                            </Button>
                            <Button
                              variant={
                                cardViews.engagement.type === "long"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              onClick={() =>
                                handleSummaryRequest(
                                  "engagement",
                                  getChannelEngagementData(),
                                  "long"
                                )
                              }
                              disabled={cardViews.engagement.loading}
                            >
                              {cardViews.engagement.loading &&
                              cardViews.engagement.type === "long"
                                ? "Generating..."
                                : "Detailed Analysis"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}
