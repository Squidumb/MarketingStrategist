import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FiMic, FiMicOff, FiSend } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import Sidebar from "@/components/Sidebar";
import TopBar, { TopNavLink } from "@/components/TopBar";
import { api } from "@/lib/api";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Assistant — StratMan" },
      { name: "description", content: "Ask StratMan AI about campaigns, analytics, regions and customer demographics in natural language." },
      { property: "og:title", content: "AI Assistant — StratMan" },
      { property: "og:description", content: "Your intelligent marketing assistant for campaigns and analytics." },
    ],
  }),
  component: ChatbotPage,
});

type Message = { sender: "user" | "bot"; text: string; timestamp: Date };

const prompts = [
  "What region do I get my most applications from?",
  "What customer demographics does my team need to focus most on and why?",
  "What marketing strategies should I use for my least performing category?",
];

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { sender: string; text: string }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { sender: "user", text: msg, timestamp: new Date() }]);
    setConversationHistory((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    setIsLoading(true);
    setShowPrompts(false);

    try {
      const res = await fetch(api("/chatbot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: conversationHistory }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.response, timestamp: new Date() },
      ]);
      setConversationHistory((prev) => [...prev, { sender: "bot", text: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to backend.", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        console.error("Voice recognition error", event.error);
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (input === "") setShowPrompts(messages.length === 0);
  }, [input, messages.length]);

  useEffect(() => {
    fetch(api("/reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Error during reset:", err));
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported in your browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <TopBar
        title="AI Assistant"
        onMenu={() => setSidebarOpen(!sidebarOpen)}
        right={<TopNavLink to="/dashboard">Dashboard</TopNavLink>}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 md:px-8">
        <div className="flex-1 py-10">
          {messages.length === 0 && (
            <div className="rise border-b border-border pb-12">
              <span className="label-mono">Session 01</span>
              <h2 className="display-xl mt-5 text-5xl">
                Ask <span className="text-accent">anything.</span>
              </h2>
              <p className="mt-5 max-w-lg text-muted-foreground">
                Your intelligent marketing assistant. Campaigns, analytics or strategy — in plain
                language.
              </p>
            </div>
          )}

          <div className="space-y-8 pt-8">
            {messages.map((msg, index) => (
              <div key={index} className="rise grid grid-cols-[auto_1fr] gap-4">
                <span className="label-mono pt-1">
                  {msg.sender === "user" ? "You" : "AI"}
                </span>
                <div>
                  <div
                    className={`prose-ink ${
                      msg.sender === "user"
                        ? "border-l-2 border-accent pl-4"
                        : "border-l-2 border-border pl-4"
                    }`}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className="label-mono mt-2 pl-4">
                    {msg.timestamp?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <span className="label-mono pt-1">AI</span>
                <div className="flex items-center gap-3 border-l-2 border-border pl-4">
                  <span className="flex gap-1">
                    <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:0ms]" />
                    <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:120ms]" />
                    <span className="h-1 w-1 animate-bounce bg-accent [animation-delay:240ms]" />
                  </span>
                  <span className="label-mono">Thinking</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showPrompts && (
            <div className="mt-10">
              <span className="label-mono">Try asking</span>
              <div className="mt-4 border-t border-border">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="group flex w-full items-start gap-4 border-b border-border py-4 text-left transition-colors hover:bg-card"
                    onClick={() => {
                      setInput(prompt);
                      setShowPrompts(false);
                    }}
                  >
                    <span className="label-mono pt-1">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[0.95rem] group-hover:text-accent">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-border bg-background/90 py-4 backdrop-blur-md">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your marketing data..."
              rows={1}
              className="field-ink min-h-[44px] max-h-[120px] flex-1 resize-none"
            />
            <button
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Start voice input"}
              className={`flex h-11 w-11 items-center justify-center border ${
                isListening ? "border-accent text-accent" : "border-border hover:border-foreground"
              }`}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
              className="btn-ink h-11 px-5"
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
