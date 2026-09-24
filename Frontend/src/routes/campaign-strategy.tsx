import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiDownload,
  FiFileText,
  FiImage,
  FiSend,
  FiShare2,
  FiZap,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import Sidebar from "@/components/Sidebar";
import TopBar, { TopNavLink } from "@/components/TopBar";
import ProgressBar from "@/components/ProgressBar";
import { api } from "@/lib/api";

export const Route = createFileRoute("/campaign-strategy")({
  head: () => ({
    meta: [
      { title: "Campaign Strategy — StratMan" },
      { name: "description", content: "Generate AI powered marketing campaign strategies, then export them to PDF, DOCX, email or social." },
      { property: "og:title", content: "Campaign Strategy — StratMan" },
      { property: "og:description", content: "Create powerful marketing campaigns with AI assistance." },
    ],
  }),
  component: CampaignStrategyPage,
});

const stages = ["Querying", "Retrieving", "Generating"];

const samplePrompts = [
  "Generate me an Instagram campaign for my top 2 performing categories",
  "Create a campaign plan for Housing Loans using brick by brick as the theme",
  "There are new government schemes coming up, search for them and generate me a professional Twitter post introducing them!",
];

function CampaignStrategyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedStrategy, setGeneratedStrategy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [tweetMessage, setTweetMessage] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setCurrentStage(0);
    setGeneratedStrategy("");
    setImagePrompt("");

    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      const response = await fetch(api("/campaign-strategy"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: selectedCategory }),
      });
      const data = await response.json();
      setGeneratedStrategy(data.response);
    } catch (error) {
      console.error("Error generating strategy:", error);
      setGeneratedStrategy("⚠️ Failed to generate strategy. Please try again later.");
    } finally {
      setIsLoading(false);
      setCurrentStage(-1);
    }
  };

  const handleSendEmail = async () => {
    if (!toEmail) {
      setAlertMessage("Please enter email address");
      return;
    }

    try {
      const response = await fetch(api("/send-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, content: generatedStrategy }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      setAlertMessage("Email sent successfully!");
    } catch (error) {
      console.error("Error:", error);
      setAlertMessage("Failed to send email. Try again!");
    }
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    try {
      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(generatedStrategy, 180);
        let y = 20;

        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 7;
        });

        doc.save("campaign_strategy.pdf");
      } else {
        const { Document, Packer, Paragraph, TextRun } = await import("docx");
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: generatedStrategy
                .split("\n")
                .map((line) => new Paragraph({ children: [new TextRun(line)] })),
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "campaign_strategy.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      setAlertMessage("Failed to generate document. Please try again.");
    }
  };

  const handlePostToTwitter = async () => {
    const match = generatedStrategy.match(/"(.*?)"/);
    const strategy = match ? match[1] : "";

    if (!strategy) {
      setTweetMessage("No valid strategy found in the generated content.");
      return;
    }

    try {
      const response = await fetch(api("/post-to-twitter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const result = await response.json();
      setTweetMessage(response.ok ? result.message : `Error: ${result.error}`);
    } catch (error) {
      console.error("Error posting to Twitter:", error);
      setTweetMessage("Failed to post to Twitter. Please try again later.");
    }
  };

  const handleGenerateImagePrompt = async () => {
    setIsGeneratingPrompt(true);
    setPromptCopied(false);
    try {
      const response = await fetch(api("/campaign-strategy/image-prompt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: generatedStrategy, product_name: selectedCategory }),
      });
      const data = await response.json();
      setImagePrompt(response.ok ? data.prompt : "Failed to generate image prompt. Please try again.");
    } catch (error) {
      console.error("Error generating image prompt:", error);
      setImagePrompt("Failed to generate image prompt. Please try again.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyImagePrompt = async () => {
    await navigator.clipboard.writeText(imagePrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const notice = alertMessage || tweetMessage;
  const noticeIsSuccess = Boolean(notice && notice.includes("success"));

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <TopBar
        title="Campaign Strategy"
        onMenu={() => setSidebarOpen(!sidebarOpen)}
        right={<TopNavLink to="/dashboard">Dashboard</TopNavLink>}
      />

      <main className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-10">
        {!generatedStrategy ? (
          <div className="space-y-10">
            <div className="rise">
              <span className="label-mono">Generator</span>
              <h2 className="display-xl mt-4 max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)]">
                Craft the <span className="text-accent">campaign.</span>
              </h2>
              <p className="mt-5 max-w-lg text-muted-foreground">
                Create powerful marketing campaigns with AI assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-0 border-t border-border lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rise border-b border-border py-10 lg:border-b-0 lg:border-r lg:pr-12">
                <label htmlFor="brief" className="label-mono">
                  Describe your campaign
                </label>
                <textarea
                  id="brief"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="Enter your campaign requirements..."
                  rows={8}
                  className="mt-4 w-full resize-none border border-border bg-card p-5 text-[0.95rem] leading-relaxed outline-none focus:border-accent"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!selectedCategory || isLoading}
                  className="btn-ink mt-6 w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="h-3 w-3 animate-spin border border-current border-t-transparent" />
                      Generating strategy...
                    </>
                  ) : (
                    <>
                      <FiZap /> Generate strategy
                    </>
                  )}
                </button>
              </section>

              <section className="rise py-10 lg:pl-12">
                <span className="label-mono">Sample prompts</span>
                <div className="mt-4 border-t border-border">
                  {samplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(prompt)}
                      className="group flex w-full items-start gap-4 border-b border-border py-5 text-left transition-colors hover:bg-card"
                    >
                      <span className="label-mono pt-1">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-[0.95rem] group-hover:text-accent">{prompt}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {isLoading && (
              <div className="max-w-xl">
                <ProgressBar stages={stages} currentStage={currentStage} />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_0.8fr]">
            <section className="rise panel">
              <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                <div className="flex items-baseline gap-3">
                  <span className="label-mono">Output</span>
                  <h2 className="text-[0.95rem] tracking-tight">Your Campaign Strategy</h2>
                </div>
                <button onClick={() => { setGeneratedStrategy(""); setImagePrompt(""); }} className="btn-outline-ink">
                  <FiArrowLeft /> Back
                </button>
              </header>

              <div className="prose-ink px-6 py-8">
                <ReactMarkdown>{generatedStrategy}</ReactMarkdown>
              </div>

              <footer className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
                <button onClick={() => handleDownload("pdf")} className="btn-outline-ink">
                  <FiFileText /> Save as PDF
                </button>
                <button onClick={() => handleDownload("docx")} className="btn-outline-ink">
                  <FiDownload /> Save as DOCX
                </button>
                <button onClick={handleGenerateImagePrompt} disabled={isGeneratingPrompt} className="btn-outline-ink">
                  {isGeneratingPrompt ? (
                    <>
                      <span className="h-3 w-3 animate-spin border border-current border-t-transparent" />
                      Generating image prompt...
                    </>
                  ) : (
                    <>
                      <FiImage /> Generate image prompt
                    </>
                  )}
                </button>
              </footer>

              {imagePrompt && (
                <div className="border-t border-border px-6 py-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="label-mono">Image generation prompt</span>
                    <button onClick={handleCopyImagePrompt} className="btn-outline-ink">
                      {promptCopied ? (
                        <>
                          <FiCheck /> Copied
                        </>
                      ) : (
                        <>
                          <FiCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-4 border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
                    {imagePrompt}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Paste this into Midjourney, DALL-E, or Stable Diffusion to generate a matching hero image.
                  </p>
                </div>
              )}
            </section>

            <aside className="rise space-y-6">
              <div className="panel p-6">
                <span className="label-mono">Share via email</span>
                <p className="mt-3 text-sm text-muted-foreground">
                  Send this strategy directly to your team members.
                </p>
                <input
                  id="toEmail"
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@email.com"
                  className="field-ink mt-6"
                />
                <button onClick={handleSendEmail} className="btn-ink mt-6 w-full">
                  <FiSend /> Send email
                </button>
              </div>

              <button onClick={handlePostToTwitter} className="btn-outline-ink w-full">
                <FiShare2 /> Post to Twitter
              </button>

              {notice && (
                <div
                  className={`flex items-start justify-between gap-3 border p-4 text-sm ${
                    noticeIsSuccess ? "border-success text-success" : "border-destructive text-destructive"
                  }`}
                >
                  <span>{notice}</span>
                  <button
                    onClick={() => {
                      setAlertMessage(null);
                      setTweetMessage(null);
                    }}
                    aria-label="Dismiss"
                    className="leading-none"
                  >
                    ×
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
