import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FiCheckCircle, FiDatabase, FiFileText, FiUploadCloud } from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { api } from "@/lib/api";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Project Setup - StratMan" },
      {
        name: "description",
        content: "Upload your own database and domain config; the agent stack reconfigures itself instantly.",
      },
    ],
  }),
  component: SetupPage,
});

type SetupStatus = {
  database: { active: string; tables: string[] };
  domain_config: { active: string; brand_name?: string; industry_scope?: string; segments: string[] };
};

function SetupPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [yamlFile, setYamlFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [status, setStatus] = useState<SetupStatus | null>(null);

  const loadStatus = async () => {
    try {
      const response = await fetch(api("/setup/status"));
      if (response.ok) setStatus(await response.json());
    } catch (error) {
      console.error("Error fetching setup status:", error);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleUpload = async () => {
    if (!dbFile && !yamlFile) {
      setIsError(true);
      setMessage("Choose a .db file and/or a domain_config.yaml file first.");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const form = new FormData();
    if (dbFile) form.append("database", dbFile);
    if (yamlFile) form.append("domain_config", yamlFile);

    try {
      const response = await fetch(api("/setup/upload"), { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");

      setIsError(false);
      setMessage("Project reconfigured — the agent stack is now using your data.");
      setDbFile(null);
      setYamlFile(null);
      await loadStatus();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <TopBar title="Project Setup" onMenu={() => setSidebarOpen(!sidebarOpen)} />

      <main className="mx-auto w-full max-w-[1000px] px-5 py-12 md:px-10">
        <div className="rise">
          <span className="label-mono">Bring your own data</span>
          <h2 className="display-xl mt-4 max-w-2xl text-[clamp(2.2rem,5vw,3.5rem)]">
            Point the agents at <span className="text-accent">your</span> project.
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Upload a SQLite database and/or a domain config YAML — every agent (SQL, chatbot,
            content, image prompt) picks up the new schema and brand instantly. No restart, no
            code changes.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-0 border-t border-border md:grid-cols-2">
          <section className="border-b border-border py-8 md:border-b-0 md:border-r md:pr-10">
            <span className="label-mono flex items-center gap-2">
              <FiDatabase /> Database (.db)
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              A SQLite file. The SQL agent introspects its schema automatically.
            </p>
            <input
              type="file"
              accept=".db"
              onChange={(e) => setDbFile(e.target.files?.[0] ?? null)}
              className="field-ink mt-6 w-full"
            />
            {dbFile && <p className="mt-2 text-xs text-muted-foreground">Selected: {dbFile.name}</p>}
          </section>

          <section className="py-8 md:pl-10">
            <span className="label-mono flex items-center gap-2">
              <FiFileText /> Domain config (.yaml)
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Brand name, contact info, currency, and customer segments — see{" "}
              <code>Backend/app/domain_config.yaml</code> for the required shape.
            </p>
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={(e) => setYamlFile(e.target.files?.[0] ?? null)}
              className="field-ink mt-6 w-full"
            />
            {yamlFile && <p className="mt-2 text-xs text-muted-foreground">Selected: {yamlFile.name}</p>}
          </section>
        </div>

        <button onClick={handleUpload} disabled={isUploading} className="btn-ink mt-8">
          {isUploading ? (
            <>
              <span className="h-3 w-3 animate-spin border border-current border-t-transparent" />
              Reconfiguring...
            </>
          ) : (
            <>
              <FiUploadCloud /> Upload &amp; activate
            </>
          )}
        </button>

        {message && (
          <div
            className={`mt-6 flex items-start gap-3 border p-4 text-sm ${
              isError ? "border-destructive text-destructive" : "border-success text-success"
            }`}
          >
            {!isError && <FiCheckCircle className="mt-0.5" />}
            <span>{message}</span>
          </div>
        )}

        {status && (
          <div className="mt-12 border-t border-border pt-8">
            <span className="label-mono">Currently active</span>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="panel p-5">
                <div className="text-sm text-muted-foreground">Database</div>
                <div className="mt-1 font-mono text-sm">{status.database.active}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {status.database.tables.length} tables: {status.database.tables.join(", ")}
                </div>
              </div>
              <div className="panel p-5">
                <div className="text-sm text-muted-foreground">Domain config</div>
                <div className="mt-1 font-mono text-sm">{status.domain_config.active}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Brand: {status.domain_config.brand_name} · Segments:{" "}
                  {status.domain_config.segments.join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
