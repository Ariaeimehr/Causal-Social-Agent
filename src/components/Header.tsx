import React from "react";
import { Play, Sparkles, Network, RefreshCw, Download, BookOpen, GitGraph, FileCode } from "lucide-react";
import { BenchmarkScenario } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunning: boolean;
  onRunSimulation: () => void;
  onDiscoverSCM: () => void;
  isDiscoveringSCM: boolean;
  benchmarks: BenchmarkScenario[];
  selectedBenchmark: string;
  onSelectBenchmark: (id: string) => void;
  topic: string;
  setTopic: (val: string) => void;
  onDownloadJSON: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  onRunSimulation,
  onDiscoverSCM,
  isDiscoveringSCM,
  benchmarks,
  selectedBenchmark,
  onSelectBenchmark,
  topic,
  setTopic,
  onDownloadJSON,
}) => {
  const tabs = [
    { id: "network", label: "Network & Agents", icon: Network },
    { id: "metrics", label: "Polarization Metrics", icon: GitGraph },
    { id: "scm", label: "SCM & Causal DAG", icon: Sparkles },
    { id: "counterfactual", label: "Counterfactual Lab (do(X))", icon: RefreshCw },
    { id: "prompts", label: "Causal Prompts & Logs", icon: BookOpen },
    { id: "code", label: "Python Repository & Paper", icon: FileCode },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Brand Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-inner font-mono font-bold text-lg">
            Ψ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-lg tracking-tight text-white">Causal-Social-Agent</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-0.5 rounded-full font-mono">
                SCM v2.4
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-mono hidden sm:inline-block">
                Gemini 3.7 Causal Oracle
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Computational Social Science × LLM Multi-Agent Simulation × Pearl's Causal Inference
            </p>
          </div>
        </div>

        {/* Global Controls & Run Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Preset Benchmark Dropdown */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-medium">Scenario:</span>
            <select
              value={selectedBenchmark}
              onChange={(e) => onSelectBenchmark(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border-0 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Simulation Button */}
          <button
            id="run-simulation-btn"
            onClick={onRunSimulation}
            disabled={isRunning}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow transition"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : "fill-current"}`} />
            <span>{isRunning ? "Simulating..." : "Run Simulation"}</span>
          </button>

          {/* Discover SCM Button */}
          <button
            id="discover-scm-btn"
            onClick={onDiscoverSCM}
            disabled={isDiscoveringSCM}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDiscoveringSCM ? "animate-spin" : ""}`} />
            <span>{isDiscoveringSCM ? "Discovering DAG..." : "Gemini Causal Oracle"}</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={onDownloadJSON}
            title="Download complete simulation and causal JSON dataset"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar border-t border-slate-800/80">
        <nav className="flex space-x-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  isActive
                    ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
