export default function ProgressBar({
  stages,
  currentStage,
}: {
  stages: string[];
  currentStage: number;
}) {
  const progress = currentStage >= 0 ? ((currentStage + 1) / stages.length) * 100 : 0;

  return (
    <div className="panel rise p-8">
      <span className="label-mono">Generating your strategy</span>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Please wait while we craft your personalized campaign strategy.
      </p>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {stages.map((stage, index) => {
          const done = index < currentStage;
          const active = index === currentStage;
          return (
            <div key={stage} className="flex items-center gap-4 py-4">
              <span
                className={`label-mono ${done ? "text-accent" : active ? "text-foreground" : ""}`}
              >
                {done ? "done" : String(index + 1).padStart(2, "0")}
              </span>
              <span className={`text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {stage}
              </span>
              {active && (
                <span className="ml-auto flex gap-1">
                  <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:120ms]" />
                  <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:240ms]" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 h-px w-full bg-border">
        <div
          className="h-px bg-accent transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="label-mono mt-3">
        {currentStage >= 0 && currentStage < stages.length
          ? `${stages[currentStage]}...`
          : "Initializing..."}
      </div>
    </div>
  );
}
