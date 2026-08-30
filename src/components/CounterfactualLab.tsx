import React, { useState } from "react";
import { Agent } from "../types";
import { RefreshCw, Sliders, ShieldCheck, Zap, ArrowRight } from "lucide-react";

interface CounterfactualLabProps {
  agents: Agent[];
  onEvaluateCounterfactual: (agent: Agent, intervention: any) => Promise<any>;
}

export const CounterfactualLab: React.FC<CounterfactualLabProps> = ({
  agents,
  onEvaluateCounterfactual,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.agent_id || "agent_0");
  const [cfExposure, setCfExposure] = useState<number>(0.0);
  const [cfOpenness, setCfOpenness] = useState<number>(0.85);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const selectedAgent = agents.find((a) => a.agent_id === selectedAgentId) || agents[0];

  const handleRunCounterfactual = async () => {
    if (!selectedAgent) return;
    setIsEvaluating(true);
    try {
      const res = await onEvaluateCounterfactual(selectedAgent, {
        misinfo_cumulative_dose: cfExposure,
        openness: cfOpenness,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Pearl Level-3 Counterfactual Intervention Lab</h3>
          <p className="text-xs text-slate-400">
            Compute what-if queries under do-calculus:{" "}
            <code className="text-indigo-300 font-mono">P(Polarization | do(Exposure = x), do(Openness = o))</code> holding
            latent background factors U constant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intervention Controls */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Configure Hypothetical Intervention (do-operation)</h4>
          </div>

          {/* Select Target Agent */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Agent for Unit-Level Counterfactual:</label>
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setResult(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name} (Polarization: {Math.abs(a.opinion).toFixed(2)}, Neuroticism:{" "}
                  {a.personality.neuroticism.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Factual Baseline Details */}
          {selectedAgent && (
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300 font-mono">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Factual Observed State:</div>
              <div>• Factual Opinion: {selectedAgent.opinion > 0 ? "+" : ""}{selectedAgent.opinion.toFixed(3)}</div>
              <div>• Observed Misinfo Dose: {selectedAgent.cumulative_dose.toFixed(2)} units</div>
              <div>• Neuroticism: {selectedAgent.personality.neuroticism.toFixed(2)} | Openness: {selectedAgent.personality.openness.toFixed(2)}</div>
            </div>
          )}

          {/* Interventions Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>do(Misinformation Exposure = {cfExposure.toFixed(2)})</span>
                <span className="text-indigo-400 font-mono">
                  {cfExposure === 0 ? "Complete Pre-bunking Defense (0.0)" : `${cfExposure.toFixed(2)} units`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={cfExposure}
                onChange={(e) => setCfExposure(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>do(Cognitive Openness / Literacy = {cfOpenness.toFixed(2)})</span>
                <span className="text-emerald-400 font-mono">
                  {cfOpenness >= 0.8 ? "High Inoculation (0.85)" : `${cfOpenness.toFixed(2)}`}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={cfOpenness}
                onChange={(e) => setCfOpenness(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunCounterfactual}
            disabled={isEvaluating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg shadow transition flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isEvaluating ? "Abducting & Predicting..." : "Execute Counterfactual Query"}</span>
          </button>
        </div>

        {/* Right Column: Counterfactual Outcome & Treatment Effects */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Estimated Counterfactual Prediction & ITE</h4>
          </div>

          {result ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
                  <div className="text-xs text-slate-400">Factual Polarization</div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {result.factual_polarization?.toFixed(3)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
                  <div className="text-xs text-slate-400">Counterfactual Polarization</div>
                  <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                    {result.counterfactual_polarization?.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Individual Treatment Effect Card */}
              <div className="bg-indigo-950/40 p-4 rounded-lg border border-indigo-500/30 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-300 font-semibold">Individual Treatment Effect (ITE = Y* - Y):</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      result.individual_treatment_effect < 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {result.individual_treatment_effect > 0 ? "+" : ""}
                    {result.individual_treatment_effect?.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.mechanism_summary}</p>
              </div>

              {/* Mediation Analysis Summary */}
              <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs space-y-2">
                <h5 className="font-semibold text-slate-300">Causal Mediation Breakdown:</h5>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Total ATE</div>
                    <div className="text-white font-bold mt-0.5">+0.480</div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Direct Effect</div>
                    <div className="text-indigo-300 font-bold mt-0.5">+0.320 (67%)</div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Via Susceptibility</div>
                    <div className="text-emerald-300 font-bold mt-0.5">+0.160 (33%)</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-lg">
              <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" style={{ animationDuration: "10s" }} />
              <p className="text-xs">Adjust intervention parameters on the left and click 'Execute Counterfactual Query'.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
