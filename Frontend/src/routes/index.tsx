import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StratMan: Agentic AI Marketing Strategist" },
      {
        name: "description",
        content:
          "StratMan is an agentic AI marketing strategist: campaign strategy generation, channel analytics and an assistant for winning campaigns.",
      },
      { property: "og:title", content: "StratMan: Agentic AI Marketing Strategist" },
      {
        property: "og:description",
        content: "Agentic AI powered marketing strategist for winning campaigns.",
      },
    ],
  }),
  component: Home,
});

const channels = [
  { name: "Facebook", strategy: "Audiences" },
  { name: "Google Ads", strategy: "Intent" },
  { name: "Instagram", strategy: "Stories" },
  { name: "YouTube", strategy: "Videos" },
  { name: "Twitter", strategy: "Trends" },
  { name: "Email", strategy: "Personal" },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2 md:px-12">
        <img className="h-7 w-auto" />
        <nav className="flex items-center gap-6">
          <Link to="/login" className="label-mono hover:text-accent">
            Login
          </Link>
          <Link to="/signup" className="btn-ink">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-[1400px] flex-1 grid-cols-1 gap-0 px-6 md:px-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rise border-b border-border py-12 lg:border-b-0 lg:border-r lg:py-16 lg:pr-16">
          <span className="label-mono">Agentic AI · Marketing</span>
          <h1 className="display-xl mt-6 text-[clamp(3.5rem,10vw,7.5rem)]">
            Strat
            <span className="text-accent">Man</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            An agentic AI powered marketing strategist for winning campaigns. From channel
            intelligence to a strategy you can send, publish and defend.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/signup" className="btn-ink">
              Get Started
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 border-t border-border">
            {[
              ["01", "Analyse"],
              ["02", "Generate"],
              ["03", "Distribute"],
            ].map(([n, label]) => (
              <div key={n} className="border-r border-border py-5 pr-4 last:border-r-0">
                <dt className="label-mono">{n}</dt>
                <dd className="mt-2 text-sm tracking-tight">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rise py-10 lg:py-16 lg:pl-16">
          <span className="label-mono">Channels covered</span>
          <ul className="mt-6 border-t border-border">
            {channels.map((channel, i) => (
              <li
                key={channel.name}
                className="group flex items-baseline justify-between gap-4 border-b border-border py-4 transition-colors hover:bg-card"
              >
                <span className="label-mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-xl tracking-tight">{channel.name}</span>
                <span className="label-mono group-hover:text-accent">{channel.strategy}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="overflow-hidden border-y border-border py-4">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="label-mono flex gap-10">
              {[
                "Campaign strategy",
                "Channel analytics",
                "Audience segments",
                "AI assistant",
                "Email distribution",
                "Social publishing",
              ].map((t) => (
                <span key={t}>{t} —</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <footer className="flex items-center px-12 py-10 md:px-12">
        <span className="label-mono">Marketing intelligence</span>
      </footer>
    </div>
  );
}
