import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { NetworkView } from "./components/NetworkView";
import { PolarizationCharts } from "./components/PolarizationCharts";
import { CausalOracleDAGView } from "./components/CausalOracleDAGView";
import { CounterfactualLab } from "./components/CounterfactualLab";
import { CausalPromptViewer } from "./components/CausalPromptViewer";
import { CodeWorkspaceViewer } from "./components/CodeWorkspaceViewer";
import {
  SimulationResultData,
  OracleSCMResponse,
  BenchmarkScenario,
  Agent,
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("network");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDiscoveringSCM, setIsDiscoveringSCM] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(12);

  const [benchmarks, setBenchmarks] = useState<BenchmarkScenario[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("ai_governance_echo");
  const [topic, setTopic] = useState<string>("Mandatory Algorithmic AI Governance & Surveillance");

  const [simData, setSimData] = useState<SimulationResultData | null>(null);
  const [scmData, setScmData] = useState<OracleSCMResponse | null>(null);
  const [oracleModel, setOracleModel] = useState<string>("gemini-3.7-flash");
  const [compiledPrompt, setCompiledPrompt] = useState<string>("");

  // Load benchmark presets on mount
  useEffect(() => {
    fetch("/api/benchmark/scenarios")
      .then((res) => res.json())
      .then((data: BenchmarkScenario[]) => {
        setBenchmarks(data);
        if (data.length > 0) {
          setSelectedBenchmark(data[0].id);
          setTopic(data[0].topic);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Run simulation helper
  const runSimulation = async (scenarioOverride?: Partial<BenchmarkScenario>) => {
    setIsRunning(true);
    try {
      const activeScenario = benchmarks.find((b) => b.id === selectedBenchmark);
      const payload = {
        topic: scenarioOverride?.topic || activeScenario?.topic || topic,
        numAgents: scenarioOverride?.numAgents || activeScenario?.numAgents || 24,
        numTimesteps: scenarioOverride?.numTimesteps || activeScenario?.numTimesteps || 14,
        networkType: scenarioOverride?.networkType || activeScenario?.networkType || "echo_chamber",
        misinformationInjectionStep: scenarioOverride?.injectionStep || activeScenario?.injectionStep || 4,
        misinformationVirulence: scenarioOverride?.virulence || activeScenario?.virulence || 0.88,
        meanOpenness: scenarioOverride?.meanOpenness || activeScenario?.meanOpenness || 0.5,
        meanNeuroticism: scenarioOverride?.meanNeuroticism || activeScenario?.meanNeuroticism || 0.55,
      };

      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: SimulationResultData = await res.json();
      setSimData(data);
      setCurrentStep(data.polarization_series.length - 1);

      // Generate prompt for SCM Discovery
      const prompt = buildLocalCausalPrompt(data);
      setCompiledPrompt(prompt);

      // Automatically trigger initial SCM discovery
      discoverSCM(prompt, data);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  // Run initial simulation on boot
  useEffect(() => {
    runSimulation();
  }, []);

  const handleSelectBenchmark = (id: string) => {
    setSelectedBenchmark(id);
    const scen = benchmarks.find((b) => b.id === id);
    if (scen) {
      setTopic(scen.topic);
      runSimulation(scen);
    }
  };

  // Discover SCM via Gemini API
  const discoverSCM = async (promptOverride?: string, dataOverride?: SimulationResultData) => {
    setIsDiscoveringSCM(true);
    try {
      const promptToSend = promptOverride || compiledPrompt;
      const dataToSend = dataOverride || simData;

      const res = await fetch("/api/causal/discover-scm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          simulationData: dataToSend,
        }),
      });

      const data = await res.json();
      if (data.oracle_response) {
        setScmData(data.oracle_response);
        setOracleModel(data.oracle_model || "gemini-3.7-flash");
      }
    } catch (e) {
      console.error("SCM Discovery error:", e);
    } finally {
      setIsDiscoveringSCM(false);
    }
  };

  // Evaluate Counterfactual Intervention
  const evaluateCounterfactual = async (agent: Agent, intervention: any) => {
    const res = await fetch("/api/causal/counterfactual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, intervention }),
    });
    return await res.json();
  };

  const handleDownloadJSON = () => {
    const exportBundle = {
      simulation: simData,
      scm_discovery: scmData,
      compiled_prompt: compiledPrompt,
      metadata: {
        timestamp: new Date().toISOString(),
        framework: "Causal-Social-Agent SCM v2.4",
      },
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `causal_social_agent_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function buildLocalCausalPrompt(data: SimulationResultData): string {
    const agents = data.agents;
    const initialPol = data.polarization_series[0] || 0.15;
    const finalPol = data.polarization_series[data.polarization_series.length - 1] || 0.65;
    const finalBimodal = data.bimodality_series[data.bimodality_series.length - 1] || 0.72;

    const highNeuroAgents = agents.filter((a) => a.personality.neuroticism > 0.6);
    const lowNeuroAgents = agents.filter((a) => a.personality.neuroticism <= 0.6);
    const highOpenAgents = agents.filter((a) => a.personality.openness > 0.6);

    const avgHighNeuroPol =
      highNeuroAgents.reduce((acc, a) => acc + Math.abs(a.opinion), 0) / Math.max(1, highNeuroAgents.length);
    const avgLowNeuroPol =
      lowNeuroAgents.reduce((acc, a) => acc + Math.abs(a.opinion), 0) / Math.max(1, lowNeuroAgents.length);
    const avgHighOpenPol =
      highOpenAgents.reduce((acc, a) => acc + Math.abs(a.opinion), 0) / Math.max(1, highOpenAgents.length);

    return `# RESEARCH STUDY: Structural Causal Model of Opinion Polarization & Misinformation Spread

## 1. Domain Context & Target Variables
We modeled an interconnected collective of ${agents.length} LLM agents discussing '${data.config.topic}' across ${data.polarization_series.length - 1} discrete interaction rounds on a ${data.config.networkType} network.
At timestep t = ${data.config.misinformationInjectionStep}, a coordinated misinformation shock (Virulence = ${data.config.misinformationVirulence}) was injected.

## 2. Empirical Statistical Observations
### A. Key Empirical Trait Stratifications:
- Pre-Injection Polarization (Esteban-Ray): ${initialPol.toFixed(4)}
- Post-Injection Polarization (Esteban-Ray): ${finalPol.toFixed(4)}
- Polarization Amplification Ratio: ${(finalPol / Math.max(1e-4, initialPol)).toFixed(2)}x
- High-Neuroticism Agents Mean Polarization: ${avgHighNeuroPol.toFixed(4)}
- Low-Neuroticism Agents Mean Polarization: ${avgLowNeuroPol.toFixed(4)}
- High-Openness Agents Mean Polarization: ${avgHighOpenPol.toFixed(4)}
- Systemic Bimodality Coefficient: ${finalBimodal.toFixed(4)}

### B. Sample Agent Trajectories (Top Extreme Shifts):
${agents
  .slice(0, 6)
  .map(
    (a) =>
      `- Agent: ${a.agent_id} (${a.role}) | Neuro: ${a.personality.neuroticism.toFixed(2)} | Open: ${a.personality.openness.toFixed(2)} | Suscept: ${a.susceptibility.toFixed(2)} | MisinfoDose: ${a.cumulative_dose.toFixed(2)} | InitOp: ${(a.opinion_history[0] || 0) > 0 ? "+" : ""}${(a.opinion_history[0] || 0).toFixed(2)} -> FinalOp: ${a.opinion > 0 ? "+" : ""}${a.opinion.toFixed(2)} (Pol: ${Math.abs(a.opinion).toFixed(2)})`
  )
  .join("\n")}

## 3. Causal Discovery Objectives
Discover the complete Directed Acyclic Graph (DAG) G = (V, E) and the structural equations X_i := f_i(PA_i, U_i).`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        onRunSimulation={() => runSimulation()}
        onDiscoverSCM={() => discoverSCM()}
        isDiscoveringSCM={isDiscoveringSCM}
        benchmarks={benchmarks}
        selectedBenchmark={selectedBenchmark}
        onSelectBenchmark={handleSelectBenchmark}
        topic={topic}
        setTopic={setTopic}
        onDownloadJSON={handleDownloadJSON}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "network" && simData && (
          <NetworkView
            agents={simData.agents}
            nodes={simData.graph_data.nodes}
            links={simData.graph_data.links}
            currentStep={currentStep}
            maxSteps={simData.polarization_series.length - 1}
            onStepChange={setCurrentStep}
            topic={topic}
          />
        )}

        {activeTab === "metrics" && simData && (
          <PolarizationCharts
            polarizationSeries={simData.polarization_series}
            bimodalitySeries={simData.bimodality_series}
            misinformationSeries={simData.misinformation_exposure_series}
            trajectory={simData.trajectory}
            agents={simData.agents}
            injectionStep={simData.config.misinformationInjectionStep}
          />
        )}

        {activeTab === "scm" && (
          <CausalOracleDAGView
            scmData={scmData}
            isDiscovering={isDiscoveringSCM}
            onTriggerDiscovery={() => discoverSCM()}
            oracleModel={oracleModel}
          />
        )}

        {activeTab === "counterfactual" && simData && (
          <CounterfactualLab
            agents={simData.agents}
            onEvaluateCounterfactual={evaluateCounterfactual}
          />
        )}

        {activeTab === "prompts" && simData && (
          <CausalPromptViewer
            events={simData.interaction_events}
            compiledPrompt={compiledPrompt}
          />
        )}

        {activeTab === "code" && <CodeWorkspaceViewer />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800/80 py-3 text-center text-xs text-slate-500">
        Causal-Social-Agent · Computational Social Science &amp; Structural Causal Modeling Research Suite
      </footer>
    </div>
  );
}
