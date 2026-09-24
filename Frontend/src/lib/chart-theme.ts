// Chart palette derived from the design system (Chart.js needs literal colors).
export const INK = "#302a22";
export const PAPER = "#f6f3ec";
export const MUTED = "#7c7365";
export const LINE = "#ddd6c9";

export const SERIES = ["#302a22", "#d1481f", "#b4842d", "#4c7a63", "#43607d", "#8e8477"];
export const SERIES_SOFT = ["#5a5145", "#e0724d", "#c9a05a", "#6f9a84", "#6c88a4", "#aaa196"];

const font = { family: "'JetBrains Mono', monospace", size: 11 } as const;

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: MUTED,
        usePointStyle: true,
        pointStyle: "rect" as const,
        boxWidth: 8,
        boxHeight: 8,
        padding: 18,
        font,
      },
    },
    datalabels: { display: false },
    tooltip: {
      backgroundColor: INK,
      titleColor: PAPER,
      bodyColor: "#cdc5b8",
      borderColor: INK,
      borderWidth: 1,
      cornerRadius: 0,
      padding: 10,
      displayColors: false,
      titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
      bodyFont: font,
    },
  },
  scales: {
    x: {
      ticks: { color: MUTED, font },
      grid: { display: false },
      border: { color: LINE },
    },
    y: {
      ticks: { color: MUTED, font },
      grid: { color: LINE },
      border: { display: false },
    },
  },
  elements: { bar: { borderRadius: 0, borderSkipped: false } },
};

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right" as const,
      labels: {
        color: MUTED,
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font,
        usePointStyle: true,
        pointStyle: "rect" as const,
        generateLabels: (chart: any) =>
          chart.data.labels.map((label: string, i: number) => ({
            text: `${label} years`,
            fillStyle: chart.data.datasets[0].backgroundColor[i],
            strokeStyle: chart.data.datasets[0].backgroundColor[i],
            hidden: !chart.isDatasetVisible(0),
            index: i,
          })),
      },
    },
    tooltip: {
      backgroundColor: INK,
      titleColor: PAPER,
      bodyColor: "#cdc5b8",
      borderColor: INK,
      borderWidth: 1,
      cornerRadius: 0,
      padding: 10,
      callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw}` },
    },
    datalabels: { display: false },
  },
  cutout: "72%",
};
