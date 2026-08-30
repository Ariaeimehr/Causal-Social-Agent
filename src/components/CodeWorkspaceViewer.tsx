import React, { useState, useEffect } from "react";
import { FileCode, Copy, Check, Download, Folder, FileText } from "lucide-react";

export const CodeWorkspaceViewer: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>("social_environment_simulator/agent.py");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/repo/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!files[selectedFile]) return;
    navigator.clipboard.writeText(files[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!files[selectedFile]) return;
    const blob = new Blob([files[selectedFile]], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.split("/").pop() || "code.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    {
      name: "1. Social Environment Simulator",
      files: [
        "social_environment_simulator/agent.py",
        "social_environment_simulator/network.py",
        "social_environment_simulator/simulator.py",
      ],
    },
    {
      name: "2. Causal Prompt Builder",
      files: [
        "causal_prompt_builder/log_extractor.py",
        "causal_prompt_builder/prompt_templates.py",
        "causal_prompt_builder/builder.py",
      ],
    },
    {
      name: "3. Polarization SCM & Causal Oracle",
      files: [
        "polarization_scm/causal_oracle.py",
        "polarization_scm/dag.py",
        "polarization_scm/scm_evaluator.py",
      ],
    },
    {
      name: "4. CLI Runner & Academic Manuscript",
      files: ["main.py", "requirements.txt", "README.md"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Academic Python Codebase & Theoretical Manuscript</h3>
            <p className="text-xs text-slate-400">
              Complete production repository implementing the 3 core academic modules and SCM discovery pipeline.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedFile.split("/").pop()}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span>Repository Modules</span>
          </h4>

          <div className="space-y-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-300 font-mono">{cat.name}</div>
                <div className="space-y-0.5 pl-2 border-l border-slate-800">
                  {cat.files.map((file) => {
                    const isSelected = selectedFile === file;
                    const fileName = file.split("/").pop();
                    return (
                      <button
                        key={file}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition flex items-center space-x-2 ${
                          isSelected
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-mono text-xs text-indigo-400 font-semibold">{selectedFile}</span>
            <span className="text-[11px] text-slate-400">
              {files[selectedFile] ? `${files[selectedFile].split("\n").length} lines` : "Loading..."}
            </span>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed max-h-[580px]">
            {loading ? "Loading codebase..." : files[selectedFile] || "# File content unavailable."}
          </pre>
        </div>
      </div>
    </div>
  );
};
