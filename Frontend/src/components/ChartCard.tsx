import type { ReactNode } from "react";
import { FiBarChart2, FiInfo } from "react-icons/fi";

export type CardView = {
  activeTab: "chart" | "summary";
  summary: string;
  type: "short" | "long";
  loading: boolean;
};

export default function ChartCard({
  index,
  chartTitle,
  summaryTitle,
  view,
  loading,
  hasData,
  emptyIcon,
  onSelectChart,
  onSelectSummary,
  onSummary,
  children,
}: {
  index: string;
  chartTitle: string;
  summaryTitle: string;
  view: CardView;
  loading: boolean;
  hasData: boolean;
  emptyIcon: ReactNode;
  onSelectChart: () => void;
  onSelectSummary: () => void;
  onSummary: (type: "short" | "long") => void;
  children: ReactNode;
}) {
  const isChart = view.activeTab === "chart";

  return (
    <article className="panel rise flex flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="label-mono">{index}</span>
          <h3 className="text-[0.95rem] tracking-tight">{isChart ? chartTitle : summaryTitle}</h3>
        </div>
        <div className="flex">
          <button
            aria-label="Chart view"
            onClick={onSelectChart}
            className={`flex h-8 w-8 items-center justify-center border border-border ${
              isChart ? "bg-foreground text-background" : "hover:border-foreground"
            }`}
          >
            <FiBarChart2 size={14} />
          </button>
          <button
            aria-label="Summary view"
            onClick={onSelectSummary}
            className={`-ml-px flex h-8 w-8 items-center justify-center border border-border ${
              !isChart ? "bg-foreground text-background" : "hover:border-foreground"
            }`}
          >
            <FiInfo size={14} />
          </button>
        </div>
      </header>

      <div className="p-6">
        {isChart ? (
          <div className="h-[300px]">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className="h-6 w-6 animate-spin border border-border border-t-accent" />
                <span className="label-mono">Loading insights</span>
              </div>
            ) : hasData ? (
              children
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <span className="text-2xl">{emptyIcon}</span>
                <span className="label-mono">No data available</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col">
            {view.loading ? (
              <div className="space-y-3">
                <div className="h-3 w-full animate-pulse bg-muted" />
                <div className="h-3 w-full animate-pulse bg-muted" />
                <div className="h-3 w-2/3 animate-pulse bg-muted" />
              </div>
            ) : (
              <>
                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {view.summary || "Click below to generate AI insights"}
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    className={`btn-outline-ink flex-1 ${view.type === "short" ? "border-foreground" : ""}`}
                    onClick={() => onSummary("short")}
                    disabled={view.loading}
                  >
                    {view.loading && view.type === "short" ? "Analyzing..." : "Quick Summary"}
                  </button>
                  <button
                    className={`btn-outline-ink flex-1 ${view.type === "long" ? "border-foreground" : ""}`}
                    onClick={() => onSummary("long")}
                    disabled={view.loading}
                  >
                    {view.loading && view.type === "long" ? "Analyzing..." : "Deep Analysis"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
