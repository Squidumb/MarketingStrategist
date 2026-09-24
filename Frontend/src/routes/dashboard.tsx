import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { FiActivity, FiBox, FiDollarSign, FiUsers } from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import TopBar, { TopNavLink } from "@/components/TopBar";
import ChartCard, { type CardView } from "@/components/ChartCard";
import { api } from "@/lib/api";
import { LINE, MUTED, SERIES, SERIES_SOFT, baseChartOptions, doughnutOptions } from "@/lib/chart-theme";

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
  ChartDataLabels,
);

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Analytics Command Center — StratMan" },
      { name: "description", content: "Channel, segment and demographic marketing analytics with AI generated insight summaries." },
      { property: "og:title", content: "Analytics Command Center — StratMan" },
      { property: "og:description", content: "Marketing analytics across channels, segments and demographics." },
    ],
  }),
  component: Dashboard,
});

type CardKey =
  | "segments"
  | "products"
  | "ageCount"
  | "applicationCount"
  | "engagement"
  | "channelPerformance";

const emptyView: CardView = { activeTab: "chart", summary: "", type: "short", loading: false };

function Dashboard() {
  const [apiData, setApiData] = useState<any>(null);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [allChannels, setAllChannels] = useState<string[]>([]);
  const [allSegments, setAllSegments] = useState<string[]>([]);
  const [cardViews, setCardViews] = useState<Record<CardKey, CardView>>({
    segments: { ...emptyView },
    products: { ...emptyView },
    ageCount: { ...emptyView },
    applicationCount: { ...emptyView },
    engagement: { ...emptyView },
    channelPerformance: { ...emptyView },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(api("/get-dashboard-data"));
        const data = await response.json();
        setApiData(data);

        const dashboardChannels =
          data.channel_conversion_rate?.map((c: any) => c.channelName) || [];
        const dashboardSegments =
          data.customer_segmentation?.map((s: any) => s.segment_name) || [];

        setAllChannels((prev) => [...new Set([...prev, ...dashboardChannels])] as string[]);
        setAllSegments((prev) => [...new Set([...prev, ...dashboardSegments])] as string[]);
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
          api(`/get-filtered-data?channel=${channelFilter}&segment=${segmentFilter}`),
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setFilteredData(data);

        const filteredChannels = data.AgeGroupData?.map((item: any) => item.ChannelName) || [];
        const filteredSegments = data.AgeGroupData?.map((item: any) => item.SegmentName) || [];

        setAllChannels((prev) => [...new Set([...prev, ...filteredChannels])] as string[]);
        setAllSegments((prev) => [...new Set([...prev, ...filteredSegments])] as string[]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [channelFilter, segmentFilter]);

  const stats =
    channelFilter === "all" && segmentFilter === "all"
      ? [
          {
            title: "Total Customers",
            value: apiData?.summary_stats?.totalCustomers?.toLocaleString() || "0",
            icon: <FiUsers />,
          },
          {
            title: "Active Campaigns",
            value: apiData?.summary_stats?.totalProducts?.toLocaleString() || "0",
            icon: <FiActivity />,
          },
          {
            title: "Total Revenue",
            value: `₹${((apiData?.summary_stats?.totalRevenue || 0) / 10000000).toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`,
            icon: <FiDollarSign />,
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
                    (item: any) =>
                      item.ChannelName === channelFilter && item.SegmentName === segmentFilter,
                  )
                  .reduce((sum: number, item: any) => sum + (item.AgeGroupCount || 0), 0);
              } else if (channelFilter !== "all") {
                totalCustomers = data
                  .filter((item: any) => item.ChannelName === channelFilter)
                  .reduce((sum: number, item: any) => sum + (item.AgeGroupCount || 0), 0);
              } else if (segmentFilter !== "all") {
                totalCustomers = data
                  .filter((item: any) => item.SegmentName === segmentFilter)
                  .reduce((sum: number, item: any) => sum + (item.AgeGroupCount || 0), 0);
              }

              return totalCustomers.toLocaleString();
            })(),
            icon: <FiUsers />,
          },
          {
            title: "Total Products",
            value: (() => {
              if (channelFilter !== "all" && segmentFilter !== "all") {
                return (
                  filteredData?.cardData?.find(
                    (item: any) =>
                      item.ChannelName === channelFilter && item.SegmentName === segmentFilter,
                  )?.UniqueProductsApplied || 0
                ).toLocaleString();
              } else if (channelFilter !== "all") {
                return (
                  filteredData?.allSegmentsVsChannels?.find(
                    (item: any) => item.ChannelName === channelFilter,
                  )?.UniqueProducts || 0
                ).toLocaleString();
              } else if (segmentFilter !== "all") {
                return (
                  filteredData?.allChannelsVsSegments?.find(
                    (item: any) => item.SegmentName === segmentFilter,
                  )?.UniqueProducts || 0
                ).toLocaleString();
              }
              return "0";
            })(),
            icon: <FiBox />,
          },
          {
            title: "Total Revenue",
            value: `₹${(() => {
              let totalRevenue = 0;
              if (channelFilter !== "all" && segmentFilter !== "all") {
                totalRevenue =
                  filteredData?.cardData?.find(
                    (item: any) =>
                      item.ChannelName === channelFilter && item.SegmentName === segmentFilter,
                  )?.TotalFeesOrCharges || 0;
              } else if (channelFilter !== "all") {
                totalRevenue =
                  filteredData?.allSegmentsVsChannels?.find(
                    (item: any) => item.ChannelName === channelFilter,
                  )?.TotalFeesOrCharges || 0;
              } else if (segmentFilter !== "all") {
                totalRevenue =
                  filteredData?.allChannelsVsSegments?.find(
                    (item: any) => item.SegmentName === segmentFilter,
                  )?.TotalFeesOrCharges || 0;
              }
              return (totalRevenue / 10000000).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              });
            })()} Cr`,
            icon: <FiDollarSign />,
          },
        ];

  const barSet = (label: string, data: number[]) => [
    {
      label,
      data,
      backgroundColor: SERIES,
      borderWidth: 0,
    },
  ];

  const getCustomerSegmentsData = () => {
    if (channelFilter !== "all" && segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const filtered = filteredData.AgeGroupData.filter(
        (item: any) => item.ChannelName === channelFilter && item.SegmentName === segmentFilter,
      );
      const totalCustomers = filtered.reduce(
        (sum: number, item: any) => sum + item.AgeGroupCount,
        0,
      );

      return {
        labels: [segmentFilter],
        datasets: barSet(`Customers (${channelFilter})`, [totalCustomers]),
      };
    }

    if (channelFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const segmentCounts: Record<string, number> = {};
      filteredData.AgeGroupData.forEach((item: any) => {
        if (item.ChannelName === channelFilter) {
          segmentCounts[item.SegmentName] =
            (segmentCounts[item.SegmentName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]);
      return {
        labels: sorted.map(([name]) => name),
        datasets: barSet(
          `Customers (${channelFilter})`,
          sorted.map(([, count]) => count),
        ),
      };
    }

    if (segmentFilter !== "all") {
      if (!filteredData?.AgeGroupData) return { labels: [], datasets: [] };

      const channelCounts: Record<string, number> = {};
      filteredData.AgeGroupData.forEach((item: any) => {
        if (item.SegmentName === segmentFilter) {
          channelCounts[item.ChannelName] =
            (channelCounts[item.ChannelName] || 0) + item.AgeGroupCount;
        }
      });

      const sorted = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
      return {
        labels: sorted.map(([name]) => name),
        datasets: barSet(
          `Customers (${segmentFilter})`,
          sorted.map(([, count]) => count),
        ),
      };
    }

    if (!apiData?.customer_segmentation) return { labels: [], datasets: [] };

    const sorted = [...apiData.customer_segmentation].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((s) => s.segment_name),
      datasets: barSet(
        "Customer Count (All)",
        sorted.map((s) => s.count),
      ),
    };
  };

  const getFastMovingCategoriesData = () => {
    if (channelFilter !== "all" || segmentFilter !== "all") {
      if (!filteredData?.CategoryData) return { labels: [], datasets: [] };

      const categoryCounts: Record<string, number> = {};
      filteredData.CategoryData.forEach((item: any) => {
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
        datasets: barSet(
          `Applications (${segmentFilter !== "all" ? segmentFilter : "All"} ${channelFilter !== "all" ? channelFilter : ""})`,
          sorted.map(([, count]) => count),
        ),
      };
    }

    if (!apiData?.product_count_by_category) return { labels: [], datasets: [] };

    const sorted = [...apiData.product_count_by_category]
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 5);

    return {
      labels: sorted.map((item) => item.category),
      datasets: barSet(
        "Product Count (All)",
        sorted.map((item) => item.product_count),
      ),
    };
  };

  const getAgeData = () => {
    if (channelFilter === "all" && segmentFilter === "all") {
      return {
        labels: apiData?.customer_age_distribution?.map((d: any) => d.ageRange) || [],
        datasets: [
          {
            data: apiData?.customer_age_distribution?.map((d: any) => d.count) || [],
            backgroundColor: SERIES,
            borderColor: "#f6f3ec",
            borderWidth: 2,
          },
        ],
      };
    }

    const ageCounts: Record<string, number> = {};
    filteredData?.AgeGroupData?.forEach((item: any) => {
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
          data: Object.keys(ageCounts)
            .sort()
            .map((age) => ageCounts[age]),
          backgroundColor: SERIES,
          borderColor: "#f6f3ec",
          borderWidth: 2,
        },
      ],
    };
  };

  const getApplicationsCount = () => {
    if (channelFilter === "all" && segmentFilter === "all") {
      const data = apiData?.age_vs_applications || [];
      return {
        labels: data.map((d: any) => d.ageGroup),
        datasets: [
          {
            data: data.map((d: any) => d.applicationsCount),
            backgroundColor: SERIES,
            borderColor: "#f6f3ec",
            borderWidth: 2,
          },
        ],
      };
    }

    const timeSpent: Record<string, number> = {};
    filteredData?.AgeGroupData?.forEach((item: any) => {
      if (
        (channelFilter === "all" || item.ChannelName === channelFilter) &&
        (segmentFilter === "all" || item.SegmentName === segmentFilter)
      ) {
        timeSpent[item.AgeGroup] = (timeSpent[item.AgeGroup] || 0) + item.ApplicationsCount;
      }
    });

    return {
      labels: Object.keys(timeSpent).sort(),
      datasets: [
        {
          data: Object.values(timeSpent),
          backgroundColor: SERIES,
          borderColor: "#f6f3ec",
          borderWidth: 2,
        },
      ],
    };
  };

  const getChannelPerformanceData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    const sortedPerformance = [...apiData.channel_performance].sort(
      (a, b) => b.application_revenue - a.application_revenue,
    );

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          label: "Budget (₹)",
          data: sortedPerformance.map((c) => c.budget),
          backgroundColor: SERIES[0],
          borderWidth: 0,
          yAxisID: "y",
          order: 2,
        },
        {
          label: "Revenue (₹)",
          data: sortedPerformance.map((c) => c.application_revenue),
          backgroundColor: SERIES[1],
          borderWidth: 0,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "line" as const,
          label: "ROAS (%)",
          data: sortedPerformance.map((c) => c.return_on_ad_spend),
          backgroundColor: SERIES[3],
          borderColor: SERIES[3],
          borderWidth: 2,
          tension: 0.35,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: SERIES[3],
          pointBorderColor: SERIES[3],
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  };

  const channelPerformanceOptions = {
    ...baseChartOptions,
    scales: {
      ...baseChartOptions.scales,
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Amount (₹)",
          color: MUTED,
          font: { family: "'JetBrains Mono', monospace", size: 10 },
        },
        ticks: { color: MUTED, font: { family: "'JetBrains Mono', monospace", size: 11 } },
        grid: { color: LINE },
        border: { display: false },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Percentage (%)",
          color: MUTED,
          font: { family: "'JetBrains Mono', monospace", size: 10 },
        },
        ticks: { color: MUTED, font: { family: "'JetBrains Mono', monospace", size: 11 } },
        grid: { drawOnChartArea: false },
        border: { display: false },
      },
    },
  };

  const getChannelEngagementData = () => {
    if (!apiData?.channel_performance) return { labels: [], datasets: [] };

    const sortedPerformance = [...apiData.channel_performance].sort((a, b) => b.clicks - a.clicks);

    return {
      labels: sortedPerformance.map((c) => c.channel_name),
      datasets: [
        {
          type: "bar" as const,
          label: "Clicks",
          data: sortedPerformance.map((c) => c.clicks),
          backgroundColor: SERIES[0],
          borderWidth: 0,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "bar" as const,
          label: "Impressions",
          data: sortedPerformance.map((c) => c.impressions),
          backgroundColor: SERIES_SOFT[0],
          borderWidth: 0,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "line" as const,
          label: "CTR (%)",
          data: sortedPerformance.map((c) => c.click_through_rate_percentage),
          backgroundColor: SERIES[1],
          borderColor: SERIES[1],
          borderWidth: 2,
          tension: 0.35,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: SERIES[1],
          pointBorderColor: SERIES[1],
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          type: "line" as const,
          label: "Conversion Rate (%)",
          data: sortedPerformance.map((c) => c.conversion_rate),
          backgroundColor: SERIES[2],
          borderColor: SERIES[2],
          borderWidth: 2,
          tension: 0.35,
          yAxisID: "y1",
          order: 0,
          pointBackgroundColor: SERIES[2],
          pointBorderColor: SERIES[2],
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  };

  const dataGetters: Record<CardKey, () => any> = {
    segments: getCustomerSegmentsData,
    products: getFastMovingCategoriesData,
    ageCount: getAgeData,
    applicationCount: getApplicationsCount,
    engagement: getChannelEngagementData,
    channelPerformance: getChannelPerformanceData,
  };

  const handleSummaryRequest = async (cardKey: CardKey, data: any, type: "short" | "long" = "short") => {
    setCardViews((prev) => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], loading: true, type },
    }));

    try {
      const response = await fetch(api("/get-dashboard-summary"), {
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
    (Object.keys(cardViews) as CardKey[]).forEach((cardKey) => {
      if (cardViews[cardKey].activeTab === "summary") {
        handleSummaryRequest(cardKey, dataGetters[cardKey](), cardViews[cardKey].type);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter, segmentFilter]);

  const setTab = (cardKey: CardKey, activeTab: "chart" | "summary") =>
    setCardViews((prev) => ({ ...prev, [cardKey]: { ...prev[cardKey], activeTab } }));

  const cardProps = (cardKey: CardKey) => ({
    view: cardViews[cardKey],
    loading,
    onSelectChart: () => setTab(cardKey, "chart"),
    onSelectSummary: () => {
      setTab(cardKey, "summary");
      if (!cardViews[cardKey].summary) {
        handleSummaryRequest(cardKey, dataGetters[cardKey](), "short");
      }
    },
    onSummary: (type: "short" | "long") =>
      handleSummaryRequest(cardKey, dataGetters[cardKey](), type),
  });

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <TopBar
        title="Analytics Command Center"
        onMenu={() => setSidebarOpen(!sidebarOpen)}
        right={<TopNavLink to="/chatbot">AI Assistant</TopNavLink>}
      />

      <main className="mx-auto w-full max-w-[1500px] px-5 py-10 md:px-10">
        {/* Filters */}
        <section className="rise flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="label-mono">Data filters</span>
            <h2 className="display-xl mt-3 text-4xl md:text-5xl">
              Signals, <span className="text-accent">not noise.</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <label htmlFor="channel" className="label-mono">
                Channel
              </label>
              <select
                id="channel"
                className="field-ink mt-1 min-w-[11rem] font-mono text-sm"
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

            <div>
              <label htmlFor="segment" className="label-mono">
                Segment
              </label>
              <select
                id="segment"
                className="field-ink mt-1 min-w-[11rem] font-mono text-sm"
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
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 border-b border-border md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rise border-b border-border px-0 py-8 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{stat.icon}</span>
                <span className="label-mono">{stat.title}</span>
              </div>
              <div className="display-xl mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">{stat.value}</div>
            </div>
          ))}
        </section>

        {/* Demographics */}
        <section className="py-12">
          <div className="flex items-baseline gap-3">
            <span className="label-mono">Part I</span>
            <h2 className="text-lg tracking-tight">Demographic Intelligence</h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              index="01"
              chartTitle="Customer Segments"
              summaryTitle="Segments Analysis"
              hasData={getCustomerSegmentsData().labels.length > 0}
              emptyIcon={<FiUsers />}
              {...cardProps("segments")}
            >
              <Bar data={getCustomerSegmentsData() as any} options={baseChartOptions as any} />
            </ChartCard>

            <ChartCard
              index="02"
              chartTitle="Top Product Categories"
              summaryTitle="Product Analysis"
              hasData={getFastMovingCategoriesData().labels.length > 0}
              emptyIcon={<FiBox />}
              {...cardProps("products")}
            >
              <Bar data={getFastMovingCategoriesData() as any} options={baseChartOptions as any} />
            </ChartCard>

            <ChartCard
              index="03"
              chartTitle="Age Distribution"
              summaryTitle="Age Analysis"
              hasData={getAgeData().labels.length > 0}
              emptyIcon={<FiUsers />}
              {...cardProps("ageCount")}
            >
              <Doughnut data={getAgeData() as any} options={doughnutOptions as any} />
            </ChartCard>

            <ChartCard
              index="04"
              chartTitle="Applications by Age"
              summaryTitle="Application Analysis"
              hasData={getApplicationsCount().labels.length > 0}
              emptyIcon={<FiActivity />}
              {...cardProps("applicationCount")}
            >
              <Doughnut data={getApplicationsCount() as any} options={doughnutOptions as any} />
            </ChartCard>
          </div>
        </section>

        {/* Performance */}
        <section className="border-t border-border py-12">
          <div className="flex items-baseline gap-3">
            <span className="label-mono">Part II</span>
            <h2 className="text-lg tracking-tight">Performance Analytics</h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              index="05"
              chartTitle="Financial Metrics"
              summaryTitle="Financial Analysis"
              hasData={getChannelPerformanceData().labels.length > 0}
              emptyIcon={<FiDollarSign />}
              {...cardProps("channelPerformance")}
            >
              <Bar
                data={getChannelPerformanceData() as any}
                options={channelPerformanceOptions as any}
              />
            </ChartCard>

            <ChartCard
              index="06"
              chartTitle="Engagement & Conversion"
              summaryTitle="Engagement Analysis"
              hasData={getChannelEngagementData().labels.length > 0}
              emptyIcon={<FiActivity />}
              {...cardProps("engagement")}
            >
              <Bar
                data={getChannelEngagementData() as any}
                options={channelPerformanceOptions as any}
              />
            </ChartCard>
          </div>
        </section>
      </main>
    </div>
  );
}
