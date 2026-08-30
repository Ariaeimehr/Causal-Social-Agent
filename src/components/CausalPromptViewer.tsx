import React, { useState } from "react";
import { InteractionEvent } from "../types";
import { Copy, Check, Terminal, MessageSquare, AlertTriangle, BookOpen } from "lucide-react";

interface CausalPromptViewerProps {
  events: InteractionEvent[];
  compiledPrompt: string;
}

export const CausalPromptViewer: React.FC<CausalPromptViewerProps> = ({ events, compiledPrompt }) => {
  const [activeSubTab, setActiveSubTab] = useState<"prompt" | "events">("prompt");
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab("prompt")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === "prompt"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Compiled SCM Causal Discovery Prompt</span>
          </button>
          <button
            onClick={() => setActiveSubTab("events")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === "events"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Time-Series Interaction & Dyad Stream ({events.length})</span>
          </button>
        </div>

        {activeSubTab === "prompt" && (
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Prompt"}</span>
          </button>
        )}
      </div>

      {activeSubTab === "prompt" ? (
        /* Compiled Prompt Viewer */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>
              Formal Causal Discovery Prompt formatted with empirical covariance matrices, trait stratifications, and SCM
              JSON target schemas:
            </span>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800/90 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[540px]">
            {compiledPrompt || "Simulation must be executed to compile causal discovery prompt."}
          </pre>
        </div>
      ) : (
        /* Interaction Events Stream */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-white">Agent Dialogue & Misinformation Injections Stream</h4>
          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-2">
            {events.map((ev, idx) => {
              const isShock = ev.type === "MISINFORMATION_SHOCK";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    isShock
                      ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      {isShock && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      <strong className={isShock ? "text-rose-300" : "text-indigo-300"}>{ev.sender_name}</strong>
                      <span className="text-slate-500">➔</span>
                      <strong className="text-slate-200">{ev.recipient_name}</strong>
                    </span>
                    <span className="text-slate-400">t={ev.timestep}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{ev.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
