import React, { useState } from "react";
import { OracleSCMResponse, CausalNode, CausalEdge } from "../types";
import { Sparkles, ArrowRight, CheckCircle2, GitCommit, Layers, HelpCircle } from "lucide-react";

interface CausalOracleDAGViewProps {
  scmData: OracleSCMResponse | null;
  isDiscovering: boolean;
  onTriggerDiscovery: () => void;
  oracleModel: string;
}

export const CausalOracleDAGView: React.FC<CausalOracleDAGViewProps> = ({
  scmData,
  isDiscovering,
  onTriggerDiscovery,
  oracleModel,
}) => {
  const [selectedEdge, setSelectedEdge] = useState<CausalEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Position nodes strategically in a layered causal graph layout
  const nodePositions: Record<string, { x: number; y: number; label: string; type: string }> = {
    Personality_Neuroticism: { x: 80, y: 70, label: "Neuroticism (N)", type: "exogenous_trait" },
    Personality_Openness: { x: 80, y: 160, label: "Openness (O)", type: "exogenous_trait" },
    Personality_Conscientiousness: { x: 80, y: 250, label: "Conscientiousness (C)", type: "exogenous_trait" },
    Network_Exposure: { x: 230, y: 50, label: "Misinfo Exposure (E)", type: "environmental" },
    Susceptibility: { x: 300, y: 190, label: "Susceptibility (S)", type: "mediator" },
    Emotional_Arousal: { x: 390, y: 80, label: "Emotional Arousal (A)", type: "mediator" },
    Opinion_Polarization: { x: 530, y: 140, label: "Opinion Polarization (Y)", type: "outcome" },
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "exogenous_trait":
        return { fill: "#312e81", stroke: "#6366f1", text: "#c7d2fe" }; // Indigo
      case "environmental":
        return { fill: "#78350f", stroke: "#f59e0b", text: "#fde68a" }; // Amber
      case "mediator":
        return { fill: "#064e3b", stroke: "#10b981", text: "#a7f3d0" }; // Emerald
      case "outcome":
        return { fill: "#881337", stroke: "#f43f5e", text: "#fecdd3" }; // Rose
      default:
        return { fill: "#1e293b", stroke: "#64748b", text: "#cbd5e1" };
    }
  };

  if (!scmData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
        <Sparkles className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-semibold text-white">Structural Causal Model (SCM) Discovery Ready</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Invoke Google Gemini to analyze observational agent trajectories, infer edge orientations, and discover the
          complete causal DAG.
        </p>
        <button
          onClick={onTriggerDiscovery}
          disabled={isDiscovering}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow transition inline-flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isDiscovering ? "Discovering DAG..." : "Execute Causal Discovery"}</span>
        </button>
      </div>
    );
  }

  const { dag, structural_equations, causal_hypotheses_evaluation, counterfactual_analysis } = scmData;

  return (
    <div className="space-y-6">
      {/* SCM Header & Oracle Provenance Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Discovered Structural Causal Model & DAG G=(V,E)</span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {oracleModel}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Pearl's Structural Equation Framework identifying direct and mediated paths to Opinion Polarization.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-300">Exogenous Trait</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Environmental</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Mediator</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Outcome</span>
          </span>
        </div>
      </div>

      {/* DAG Interactive Canvas (Top) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span>Click any causal edge or node to inspect mechanistic justifications and p-values.</span>
          <span className="font-mono text-indigo-400">
            {dag.nodes.length} Nodes | {dag.edges.length} Directed Causal Edges
          </span>
        </div>

        {/* DAG SVG Canvas */}
        <div className="w-full aspect-[2.2/1] max-h-[360px] bg-slate-950/70 rounded-lg border border-slate-800/80 p-2 relative overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 620 300" className="w-full h-full">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
              </marker>
              <marker
                id="arrow-selected"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Render Causal Edges */}
            {dag.edges.map((edge, idx) => {
              const u = nodePositions[edge.source];
              const v = nodePositions[edge.target];
              if (!u || !v) return null;

              const isSelected = selectedEdge === edge;
              const isPositive = edge.weight > 0;
              const strokeColor = isSelected ? "#f43f5e" : isPositive ? "#6366f1" : "#06b6d4";

              // Bezier curve calculation
              const dx = v.x - u.x;
              const dy = v.y - u.y;
              const cx = u.x + dx * 0.5;
              const cy = u.y + dy * 0.5 - (dx > 250 ? 25 : 0);

              const pathData = `M ${u.x} ${u.y} Q ${cx} ${cy} ${v.x} ${v.y}`;

              return (
                <g key={`edge-${idx}`} className="cursor-pointer" onClick={() => setSelectedEdge(edge)}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : Math.max(1.5, Math.abs(edge.weight) * 3)}
                    markerEnd={isSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                    className="transition-all duration-200 hover:opacity-100"
                    opacity={isSelected ? 1 : 0.8}
                  />
                  {/* Edge Weight Label */}
                  <rect
                    x={cx - 16}
                    y={cy - 9}
                    width="32"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {edge.weight > 0 ? "+" : ""}
                    {edge.weight.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Render Nodes */}
            {Object.entries(nodePositions).map(([nodeId, pos]) => {
              const colors = getNodeColor(pos.type);
              const isNodeSelected = selectedNode === nodeId;

              return (
                <g
                  key={nodeId}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(nodeId)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                >
                  <rect
                    x="-55"
                    y="-16"
                    width="110"
                    height="32"
                    rx="8"
                    fill={colors.fill}
                    stroke={isNodeSelected ? "#ffffff" : colors.stroke}
                    strokeWidth={isNodeSelected ? 2.5 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill={colors.text}
                    fontSize="9"
                    fontWeight="600"
                    className="select-none pointer-events-none"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Edge Inspector Card */}
        {selectedEdge && (
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-indigo-500/40 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <span className="text-indigo-400 font-mono">{selectedEdge.source}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-purple-400 font-mono">{selectedEdge.target}</span>
              </span>
              <span className="text-xs font-mono text-emerald-400">
                β = {selectedEdge.weight > 0 ? "+" : ""}
                {selectedEdge.weight.toFixed(2)} (p = {selectedEdge.p_value})
              </span>
            </div>
            <p className="text-slate-300">{selectedEdge.causal_mechanism}</p>
          </div>
        )}
      </div>

      {/* Structural Equations & Causal Hypotheses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mathematical Structural Equations */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Structural Causal Equations (SCM Formulation)</h4>
          </div>

          <div className="space-y-3">
            {structural_equations.map((eq, idx) => (
              <div key={idx} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-indigo-300 font-mono">{eq.target_variable}</span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    R² = <strong className="text-white">{eq.r_squared}</strong>
                  </span>
                </div>
                <div className="p-2 bg-slate-950 rounded font-mono text-xs text-emerald-300 overflow-x-auto">
                  {eq.latex}
                </div>
                <div className="text-[11px] text-slate-400">{eq.functional_form}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Causal Hypotheses Validation */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Empirical Causal Hypotheses Validation</h4>
          </div>

          <div className="space-y-3">
            {causal_hypotheses_evaluation.map((hyp, idx) => (
              <div key={idx} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{hyp.hypothesis}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-semibold font-mono">
                    ATE = {hyp.estimated_ate > 0 ? "+" : ""}
                    {hyp.estimated_ate}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{hyp.theoretical_justification}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
