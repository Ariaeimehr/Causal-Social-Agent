#!/usr/bin/env python3
"""
Causal-Social-Agent: Academic Simulation & SCM Discovery Pipeline
=================================================================
A Computational Social Science framework integrating LLM Agents,
Causal Inference, and Structural Causal Models (SCMs) for modeling
opinion polarization and misinformation dynamics.

Usage:
    python main.py --topic "AI Governance & Societal Risk" --agents 24 --timesteps 15 --network echo_chamber
    python main.py --benchmark
    python main.py --discover-scm
"""

import argparse
import json
import sys
import os

from social_environment_simulator.simulator import (
    SocialEnvironmentSimulator,
    SimulationConfig,
)
from social_environment_simulator.network import NetworkType
from causal_prompt_builder.log_extractor import InteractionLogExtractor
from causal_prompt_builder.builder import CausalPromptBuilder
from polarization_scm.causal_oracle import GeminiCausalOracle
from polarization_scm.scm_evaluator import StructuralCausalModel


def print_banner():
    print("=" * 72)
    print("  CAUSAL-SOCIAL-AGENT: Computational Social Science & SCM Framework")
    print("  Combining LLM Agents, Causal Discovery & Pearl's Structural Equations")
    print("=" * 72)


def run_pipeline(args: argparse.Namespace) -> None:
    print_banner()

    # 1. Initialize Simulator Config
    net_type = NetworkType(args.network)
    config = SimulationConfig(
        topic=args.topic,
        num_agents=args.agents,
        num_timesteps=args.timesteps,
        network_type=net_type,
        misinformation_injection_step=args.injection_step,
        misinformation_virulence=args.virulence,
        random_seed=args.seed,
    )

    print("\n[Step 1] Initializing Agent Simulation...")
    print(f"  • Topic: {config.topic}")
    print(f"  • Agents: {config.num_agents} | Topology: {config.network_type.value}")
    print(f"  • Misinformation Shock at t={config.misinformation_injection_step} (Virulence: {config.misinformation_virulence})")

    # 2. Run Multi-Agent Simulation
    sim = SocialEnvironmentSimulator(config)
    result = sim.run_simulation()

    print(f"\n[Step 2] Simulation Completed ({len(result.trajectory)} rounds)")
    print(f"  • Initial Esteban-Ray Polarization: {result.polarization_series[0]:.4f}")
    print(f"  • Final Esteban-Ray Polarization:   {result.polarization_series[-1]:.4f}")
    print(f"  • Final Sarle Bimodality Coeff:     {result.bimodality_series[-1]:.4f}")

    # 3. Extract Causal Interaction Features
    print("\n[Step 3] Extracting Interaction Logs & Feature Matrices...")
    extractor = InteractionLogExtractor(result)
    features = extractor.extract_features()

    inter = features.intervention_summary
    print(f"  • Pre- vs Post-Shock Polarization Amplification: {inter['polarization_amplification_ratio']}x")
    print(f"  • High-Neuroticism Agents Mean Polarization: {inter['high_neuroticism_avg_polarization']}")
    print(f"  • High-Openness Agents Mean Polarization:    {inter['high_openness_avg_polarization']}")

    # 4. Build Causal Prompts
    print("\n[Step 4] Compiling Causal SCM Prompt...")
    builder = CausalPromptBuilder(features, result.to_dict()["config"])
    prompt = builder.build_scm_discovery_prompt()
    print(f"  • Structured Prompt Size: {len(prompt)} characters")

    # 5. Discover SCM with Gemini Causal Oracle
    print("\n[Step 5] Invoking Gemini Causal Oracle for SCM & DAG Discovery...")
    oracle = GeminiCausalOracle(model_name="gemini-3.7-flash")
    oracle_res = oracle.discover_scm(builder)

    print(f"  • Discovered Nodes: {len(oracle_res.dag.nodes)}")
    print(f"  • Discovered Causal Edges: {len(oracle_res.dag.edges)}")
    print(f"  • DAG is Strictly Acyclic: {oracle_res.dag.is_acyclic()}")
    print(f"  • Causal Topological Order: {' -> '.join(oracle_res.dag.topological_sort())}")

    print("\n  --- Discovered Causal Edges & Mechanisms ---")
    for edge in oracle_res.dag.edges:
        print(f"  • {edge.source:<26} -> {edge.target:<22} | β = {edge.weight:+.2f} (p={edge.p_value:.3f})")

    # 6. Evaluate Structural Causal Model & Counterfactuals
    print("\n[Step 6] Estimating Treatment Effects & Pearl Level-3 Counterfactuals...")
    scm_eval = StructuralCausalModel(oracle_res.dag)
    ate_res = scm_eval.estimate_ate_misinformation_exposure(features.agent_records)

    print(f"  • Average Treatment Effect (ATE) of Misinformation: {ate_res.ate:+.4f} (p={ate_res.p_value:.4f})")
    print(f"  • Direct Effect: {ate_res.direct_effect:+.4f} | Mediated via Susceptibility: {ate_res.indirect_mediated_effect:+.4f} ({ate_res.proportion_mediated*100:.1f}%)")

    # Sample Counterfactual Evaluation
    sample_agent = features.agent_records[0] if features.agent_records else {}
    cf_res = scm_eval.evaluate_counterfactual(
        factual_agent=sample_agent,
        intervention={"misinfo_cumulative_dose": 0.0, "openness": 0.90},
    )
    print("\n  --- Pearl Level-3 Counterfactual Query on Agent-00 ---")
    print(f"  • Factual Observed Polarization:       {cf_res['factual_polarization']:.3f}")
    print(f"  • Counterfactual Polarization (do):     {cf_res['counterfactual_polarization']:.3f}")
    print(f"  • Individual Treatment Effect (ITE):   {cf_res['individual_treatment_effect']:+.3f}")

    # Export results to JSON
    out_file = args.output
    export_payload = {
        "simulation": result.to_dict(),
        "causal_oracle": oracle_res.raw_response,
        "ate_analysis": {
            "ate": ate_res.ate,
            "direct_effect": ate_res.direct_effect,
            "indirect_effect": ate_res.indirect_mediated_effect,
            "proportion_mediated": ate_res.proportion_mediated,
        },
        "graphviz_dot": oracle_res.dag.to_graphviz_dot(),
        "latex_tikz": oracle_res.dag.to_latex_tikz(),
    }
    with open(out_file, "w") as f:
        json.dump(export_payload, f, indent=2)
    print(f"\n[✓] Full Academic Causal Artifacts Saved to '{out_file}'\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Causal-Social-Agent: Causal Modeling of Opinion Polarization")
    parser.add_argument("--topic", type=str, default="Mandatory Algorithmic AI Governance & Surveillance", help="Discussion topic")
    parser.add_argument("--agents", type=int, default=24, help="Number of simulated social agents")
    parser.add_argument("--timesteps", type=int, default=15, help="Number of simulation rounds")
    parser.add_argument("--network", type=str, choices=["scale_free", "small_world", "echo_chamber", "erdos_renyi"], default="echo_chamber", help="Network topology")
    parser.add_argument("--injection-step", type=int, default=4, help="Timestep to inject misinformation shock")
    parser.add_argument("--virulence", type=float, default=0.85, help="Misinformation contagion virulence [0.0, 1.0]")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--output", type=str, default="simulation_causal_results.json", help="Path to export JSON output")
    parser.add_argument("--benchmark", action="store_true", help="Run full academic benchmark suite")
    parser.add_argument("--discover-scm", action="store_true", help="Run SCM discovery pipeline")

    args = parser.parse_args()
    run_pipeline(args)


if __name__ == "__main__":
    main()
