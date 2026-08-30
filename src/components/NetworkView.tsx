import React, { useState, useMemo } from "react";
import { Agent, NetworkLink, NetworkNode } from "../types";
import { User, ShieldAlert, Brain, Activity, MessageSquare, Flame } from "lucide-react";

interface NetworkViewProps {
  agents: Agent[];
  nodes: NetworkNode[];
  links: NetworkLink[];
  currentStep: number;
  maxSteps: number;
  onStepChange: (step: number) => void;
  topic: string;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  agents,
  nodes,
  links,
  currentStep,
  maxSteps,
  onStepChange,
  topic,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.agent_id || "agent_0");

  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.agent_id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Compute fixed 2D layout coordinates for nodes
  const nodePositions = useMemo(() => {
    const n = nodes.length || agents.length;
    const width = 600;
    const height = 460;
    const padding = 50;
    const coords: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node, idx) => {
      const isLeftCluster = idx < n / 2;
      const clusterCenterX = isLeftCluster ? width * 0.32 : width * 0.68;
      const clusterCenterY = height * 0.5;

      const angle = (idx % (n / 2)) * ((2 * Math.PI) / (n / 2));
      const radius = 110 + (idx % 3) * 20;

      const x = Math.max(padding, Math.min(width - padding, clusterCenterX + Math.cos(angle) * radius));
      const y = Math.max(padding, Math.min(height - padding, clusterCenterY + Math.sin(angle) * (radius * 0.85)));

      coords[node.id] = { x, y };
    });

    return coords;
  }, [nodes, agents]);

  // Get opinion at current step
  const getAgentOpinionAtStep = (agent: Agent, step: number) => {
    if (!agent.opinion_history || agent.opinion_history.length === 0) return agent.opinion;
    const idx = Math.min(step, agent.opinion_history.length - 1);
    return agent.opinion_history[idx];
  };

  // Color mapping: Negative opinion (Red/Rose) -> Neutral (Slate) -> Positive opinion (Indigo/Blue)
  const getOpinionColor = (opinion: number) => {
    if (opinion < -0.2) {
      const intensity = Math.min(1, Math.abs(opinion));
      return `rgb(${Math.round(220 * intensity + 50)}, ${Math.round(60 * (1 - intensity))}, ${Math.round(80 * (1 - intensity))})`;
    } else if (opinion > 0.2) {
      const intensity = Math.min(1, opinion);
      return `rgb(${Math.round(79 * (1 - intensity))}, ${Math.round(70 + 80 * intensity)}, ${Math.round(229 * intensity + 50)})`;
    }
    return "#64748b"; // Slate neutral
  };

  return (
    <div className="space-y-6">
      {/* Simulation Timeline Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Social Network Opinion & Misinformation Contagion</h3>
            <p className="text-xs text-slate-400">
              Topic: <span className="text-indigo-300 font-medium">{topic}</span>
            </p>
          </div>
        </div>

        {/* Step Scrubber */}
        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-xs font-mono text-slate-300">
            Timestep: <strong className="text-indigo-400 font-bold text-sm">t = {currentStep}</strong> / {maxSteps}
          </span>
          <input
            type="range"
            min="0"
            max={maxSteps}
            value={currentStep}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="w-36 sm:w-48 accent-indigo-500 cursor-pointer"
          />
          {currentStep >= 4 && (
            <span className="flex items-center space-x-1 text-[11px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              <Flame className="w-3 h-3 animate-pulse" />
              <span>Misinfo Shock Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid: Network Graph (Left) & Agent Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Network Canvas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between shadow-sm relative overflow-hidden">
          <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Opposed (-1.0)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block ml-2"></span>
              <span>Neutral (0.0)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block ml-2"></span>
              <span>In Favor (+1.0)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {nodes.length} Agents | {links.length} Dyads
            </span>
          </div>

          {/* SVG Graph View */}
          <div className="relative w-full aspect-[4/3] max-h-[480px] bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center justify-center">
            <svg viewBox="0 0 600 460" className="w-full h-full">
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Network Links */}
              {links.map((link, idx) => {
                const u = nodePositions[link.source];
                const v = nodePositions[link.target];
                if (!u || !v) return null;
                const isSelectedLink = link.source === selectedAgentId || link.target === selectedAgentId;

                return (
                  <line
                    key={`link-${idx}`}
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={isSelectedLink ? "#818cf8" : "#334155"}
                    strokeWidth={isSelectedLink ? 2 : 1}
                    strokeOpacity={isSelectedLink ? 0.9 : 0.4}
                  />
                );
              })}

              {/* Agent Nodes */}
              {agents.map((agent) => {
                const pos = nodePositions[agent.agent_id];
                if (!pos) return null;
                const currentOp = getAgentOpinionAtStep(agent, currentStep);
                const color = getOpinionColor(currentOp);
                const isSelected = agent.agent_id === selectedAgentId;
                const isVulnerable = agent.susceptibility > 0.65;
                const radius = 14 + agent.exposure_count * 1.5;

                return (
                  <g
                    key={agent.agent_id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedAgentId(agent.agent_id)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  >
                    {/* Vulnerability / Misinfo Shock Aura */}
                    {isVulnerable && (
                      <circle
                        r={radius + 6}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        className="animate-spin origin-center"
                        style={{ animationDuration: "12s" }}
                      />
                    )}

                    {/* Selected Halo */}
                    {isSelected && (
                      <circle r={radius + 8} fill="none" stroke="#6366f1" strokeWidth="2.5" />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={radius}
                      fill={color}
                      stroke={isSelected ? "#ffffff" : "#1e293b"}
                      strokeWidth="2"
                    />

                    {/* Node Text Label */}
                    <text
                      dy="0.35em"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none pointer-events-none"
                    >
                      {agent.agent_id.replace("agent_", "")}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full text-center text-[11px] text-slate-500 mt-2">
            Click any agent node above to inspect individual Big-Five psychometrics, susceptibility, and opinion trajectories.
          </div>
        </div>

        {/* Right Column: Deep Agent Profile Inspector */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {selectedAgent ? (
            <>
              {/* Agent Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow"
                    style={{ backgroundColor: getOpinionColor(getAgentOpinionAtStep(selectedAgent, currentStep)) }}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span>{selectedAgent.name}</span>
                      <span className="text-xs font-normal text-slate-400">({selectedAgent.role})</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedAgent.agent_id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Opinion (t={currentStep})</div>
                  <div
                    className="text-base font-bold font-mono"
                    style={{ color: getOpinionColor(getAgentOpinionAtStep(selectedAgent, currentStep)) }}
                  >
                    {getAgentOpinionAtStep(selectedAgent, currentStep) > 0 ? "+" : ""}
                    {getAgentOpinionAtStep(selectedAgent, currentStep).toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Susceptibility & Cognitive Health Metric */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Susceptibility (S)</span>
                  </div>
                  <div className="text-base font-bold text-white mt-1 font-mono">
                    {(selectedAgent.susceptibility * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${selectedAgent.susceptibility > 0.6 ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${selectedAgent.susceptibility * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Misinfo Dose (E)</span>
                  </div>
                  <div className="text-base font-bold text-white mt-1 font-mono">
                    {selectedAgent.cumulative_dose.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Exposures: <strong>{selectedAgent.exposure_count}</strong> times
                  </div>
                </div>
              </div>

              {/* Big Five OCEAN Psychometric Profile */}
              <div className="bg-slate-800/50 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Big-Five Psychometric Vector (OCEAN)
                </h5>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Neuroticism (N) - Anxiety & Reactivity</span>
                      <span className="font-mono text-rose-300">
                        {(selectedAgent.personality.neuroticism * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${selectedAgent.personality.neuroticism * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Openness (O) - Cognitive Deliberation</span>
                      <span className="font-mono text-indigo-300">
                        {(selectedAgent.personality.openness * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full"
                        style={{ width: `${selectedAgent.personality.openness * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Conscientiousness (C) - Evidence Seeking</span>
                      <span className="font-mono text-emerald-300">
                        {(selectedAgent.personality.conscientiousness * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${selectedAgent.personality.conscientiousness * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Confirmation Bias Anchor</span>
                      <span className="font-mono text-amber-300">
                        {(selectedAgent.personality.confirmation_bias * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${selectedAgent.personality.confirmation_bias * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Opinion Sparkline */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Opinion Trajectory (t=0 to {maxSteps})</span>
                  <span className="font-mono text-slate-300">
                    Δ: {(selectedAgent.opinion - selectedAgent.opinion_history[0]).toFixed(3)}
                  </span>
                </div>
                <div className="h-16 flex items-end space-x-1.5">
                  {selectedAgent.opinion_history.map((op, idx) => {
                    const normalizedHeight = Math.max(10, ((op + 1.0) / 2.0) * 100);
                    const isCur = idx === currentStep;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div
                          className={`w-full rounded-t transition-all ${
                            isCur ? "ring-2 ring-white" : ""
                          }`}
                          style={{
                            height: `${normalizedHeight}%`,
                            backgroundColor: getOpinionColor(op),
                          }}
                        />
                        <span className="text-[9px] font-mono text-slate-500 mt-1">{idx}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 py-12">No agent selected</div>
          )}
        </div>
      </div>
    </div>
  );
};
