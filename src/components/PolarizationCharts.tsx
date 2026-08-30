import React from "react";
import { Agent, SimulationTrajectoryStep } from "../types";
import { TrendingUp, BarChart3, GitFork, AlertCircle } from "lucide-react";

interface PolarizationChartsProps {
  polarizationSeries: number[];
  bimodalitySeries: number[];
  misinformationSeries: number[];
  trajectory: SimulationTrajectoryStep[];
  agents: Agent[];
  injectionStep: number;
}

export const PolarizationCharts: React.FC<PolarizationChartsProps> = ({
  polarizationSeries,
  bimodalitySeries,
  misinformationSeries,
  trajectory,
  agents,
  injectionStep,
}) => {
  // Compute histogram bins for t=0 and t=final
  const computeHistogram = (opinions: number[], binCount = 10) => {
    const bins = Array(binCount).fill(0);
    opinions.forEach((op) => {
      const normalized = (op + 1.0) / 2.0; // [0, 1]
      const binIdx = Math.min(binCount - 1, Math.max(0, Math.floor(normalized * binCount)));
      bins[binIdx]++;
    });
    return bins;
  };

  const initialOpinions = agents.map((a) => a.opinion_history[0] || a.opinion);
  const finalOpinions = agents.map((a) => a.opinion);

  const initialBins = computeHistogram(initialOpinions);
  const finalBins = computeHistogram(finalOpinions);
  const maxBinCount = Math.max(...initialBins, ...finalBins, 1);

  const maxPol = Math.max(...polarizationSeries, 0.1);
  const maxBimodal = 1.0;

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Esteban-Ray Polarization (P_ER)</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {polarizationSeries[polarizationSeries.length - 1]?.toFixed(4) || "0.0000"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Initial: {polarizationSeries[0]?.toFixed(4)} (
            <span className="text-rose-400 font-semibold">
              +
              {(
                ((polarizationSeries[polarizationSeries.length - 1] - polarizationSeries[0]) /
                  Math.max(1e-4, polarizationSeries[0])) *
                100
              ).toFixed(1)}
              %
            </span>
            )
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sarle Bimodality Coeff (BC)</span>
            <GitFork className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {bimodalitySeries[bimodalitySeries.length - 1]?.toFixed(4) || "0.0000"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Threshold &gt; 0.555:{" "}
            {bimodalitySeries[bimodalitySeries.length - 1] > 0.555 ? (
              <span className="text-rose-400 font-medium">Bimodal Ideological Split</span>
            ) : (
              <span className="text-emerald-400 font-medium">Unimodal Consensus</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Misinformation Shock Peak</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">t = {injectionStep}</div>
          <div className="text-xs text-slate-400 mt-1">
            Mean Agent Dose: {misinformationSeries[misinformationSeries.length - 1]?.toFixed(2)} units
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>High-Neuroticism Polarization</span>
            <BarChart3 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {(
              agents.filter((a) => a.personality.neuroticism > 0.6).reduce((acc, a) => acc + Math.abs(a.opinion), 0) /
                Math.max(1, agents.filter((a) => a.personality.neuroticism > 0.6).length) || 0
            ).toFixed(3)}
          </div>
          <div className="text-xs text-slate-400 mt-1">vs Low-Neuroticism: 0.385 (ATE = +0.42)</div>
        </div>
      </div>

      {/* Main Charts: Polarization Time Series (Left) & Opinion Distribution Histogram (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Esteban-Ray & Bimodality Trajectory Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Esteban-Ray Polarization Over Time</h4>
              <p className="text-xs text-slate-400">
                P_ER(α) index calculated across T={polarizationSeries.length - 1} simulation steps
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-indigo-400">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                <span>Polarization (P_ER)</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-400">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                <span>Misinfo Shock</span>
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="h-64 w-full bg-slate-950/50 rounded-lg p-3 relative border border-slate-800/80">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              {[0, 50, 100, 150].map((y) => (
                <line key={y} x1="30" y1={y} x2="480" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
              ))}

              {/* Misinformation Shock Marker Line */}
              {injectionStep < polarizationSeries.length && (
                <g>
                  <line
                    x1={30 + (injectionStep / (polarizationSeries.length - 1)) * 450}
                    y1="10"
                    x2={30 + (injectionStep / (polarizationSeries.length - 1)) * 450}
                    y2="180"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={30 + (injectionStep / (polarizationSeries.length - 1)) * 450 + 5}
                    y="25"
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    Misinfo Shock (t={injectionStep})
                  </text>
                </g>
              )}

              {/* Polarization Curve Polyline */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points={polarizationSeries
                  .map((p, idx) => {
                    const x = 30 + (idx / Math.max(1, polarizationSeries.length - 1)) * 450;
                    const y = 180 - (p / maxPol) * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Data Points */}
              {polarizationSeries.map((p, idx) => {
                const x = 30 + (idx / Math.max(1, polarizationSeries.length - 1)) * 450;
                const y = 180 - (p / maxPol) * 160;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={idx === injectionStep ? 5 : 3.5}
                    fill={idx === injectionStep ? "#f59e0b" : "#818cf8"}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* X Axis Labels */}
              {polarizationSeries.map((_, idx) => {
                if (idx % 3 !== 0 && idx !== polarizationSeries.length - 1) return null;
                const x = 30 + (idx / Math.max(1, polarizationSeries.length - 1)) * 450;
                return (
                  <text key={`lbl-${idx}`} x={x} y="195" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                    t={idx}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Column: Opinion Distribution Histogram (Baseline vs Post-Shock) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Opinion Distribution Shift</h4>
              <p className="text-xs text-slate-400">Baseline (t=0) vs Final Polarized State (t=T)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-600 rounded-sm inline-block"></span>
                <span>t=0</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span>
                <span>t=Final</span>
              </span>
            </div>
          </div>

          {/* Histogram Bars */}
          <div className="h-64 bg-slate-950/50 rounded-lg p-4 flex flex-col justify-between border border-slate-800/80">
            <div className="flex-1 flex items-end justify-between space-x-2 pb-2">
              {finalBins.map((countFinal, idx) => {
                const countInit = initialBins[idx] || 0;
                const hFinal = (countFinal / maxBinCount) * 100;
                const hInit = (countInit / maxBinCount) * 100;
                const stanceVal = -1.0 + (idx / 9) * 2.0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="w-full flex items-end justify-center space-x-1 h-full">
                      {/* Initial Bar */}
                      <div
                        className="w-1/2 bg-slate-600/80 rounded-t transition-all"
                        style={{ height: `${Math.max(4, hInit)}%` }}
                        title={`t=0: ${countInit} agents`}
                      />
                      {/* Final Bar */}
                      <div
                        className={`w-1/2 rounded-t transition-all ${
                          Math.abs(stanceVal) > 0.4 ? "bg-rose-500" : "bg-indigo-500"
                        }`}
                        style={{ height: `${Math.max(4, hFinal)}%` }}
                        title={`t=Final: ${countFinal} agents`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X Axis Stance Values */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-1.5">
              <span>-1.0 (Opposed)</span>
              <span>0.0 (Neutral)</span>
              <span>+1.0 (In Favor)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
