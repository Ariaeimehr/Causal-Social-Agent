"""
Causal Prompt Builder
======================
Compiles simulation statistics and feature matrices into final prompt payloads
tailored for LLM Causal Oracles.
"""

from typing import Dict, Any
import json

from .log_extractor import ExtractedCausalFeatures
from .prompt_templates import SCMPromptTemplate


class CausalPromptBuilder:
    """
    Constructs high-fidelity academic prompts for SCM discovery and counterfactual evaluation.
    """

    def __init__(self, features: ExtractedCausalFeatures, config_dict: Dict[str, Any]) -> None:
        self.features = features
        self.config = config_dict

    def build_scm_discovery_prompt(self) -> str:
        """Constructs prompt for discovering DAG structure and structural equations."""
        corr_str = json.dumps(self.features.correlation_matrix, indent=2)
        
        # Sort agent records by polarization magnitude descending
        sorted_records = sorted(
            self.features.agent_records,
            key=lambda r: r["polarization_magnitude"],
            reverse=True
        )

        sample_rows = []
        for r in sorted_records[:6]:
            sample_rows.append(
                f"- Agent: {r['agent_id']} ({r['role']}) | Neuro: {r['neuroticism']:.2f} | "
                f"Open: {r['openness']:.2f} | Suscept: {r['susceptibility']:.2f} | "
                f"MisinfoDose: {r['misinfo_cumulative_dose']:.2f} | InitOp: {r['initial_opinion']:+.2f} -> "
                f"FinalOp: {r['final_opinion']:+.2f} (Polarization: {r['polarization_magnitude']:.2f})"
            )
        sample_agents_table = "\n".join(sample_rows)

        inter = self.features.intervention_summary
        temp = self.features.temporal_summary

        prompt = SCMPromptTemplate.DISCOVERY_TEMPLATE.format(
            topic=self.config.get("topic", "Polarizing Social Issue"),
            num_agents=len(self.features.agent_records),
            total_timesteps=temp["total_timesteps"],
            network_type=self.config.get("network_type", "echo_chamber"),
            injection_step=inter["injection_timestep"],
            virulence=self.config.get("misinformation_virulence", 0.85),
            correlation_matrix_str=corr_str,
            pre_injection_polarization=inter["pre_injection_polarization"],
            post_injection_polarization=inter["post_injection_polarization"],
            amplification_ratio=inter["polarization_amplification_ratio"],
            high_neuro_pol=inter["high_neuroticism_avg_polarization"],
            low_neuro_pol=inter["low_neuroticism_avg_polarization"],
            high_open_pol=inter["high_openness_avg_polarization"],
            bimodality_coeff=round(temp["final_bimodality_coeff"], 4),
            sample_agents_table=sample_agents_table,
        )

        return prompt

    def build_counterfactual_prompt(self, target_agent_id: str, intervention: Dict[str, Any]) -> str:
        """Constructs prompt for evaluating Pearl's 3-step counterfactual query."""
        agent_dict = next(
            (r for r in self.features.agent_records if r["agent_id"] == target_agent_id),
            self.features.agent_records[0] if self.features.agent_records else {}
        )

        return f"""# COUNTERFACTUAL QUERY (Pearl Level-3 Abduction-Action-Prediction)

## 1. Unit of Analysis:
- Agent ID: {agent_dict.get('agent_id')}
- Personality Vector: Neuroticism={agent_dict.get('neuroticism', 0.5):.2f}, Openness={agent_dict.get('openness', 0.5):.2f}, Conscientiousness={agent_dict.get('conscientiousness', 0.5):.2f}
- Observed Misinformation Dose: {agent_dict.get('misinfo_cumulative_dose', 0.0):.2f}
- Observed Factual Opinion Trajectory: {agent_dict.get('initial_opinion', 0.0):+.2f} -> {agent_dict.get('final_opinion', 0.0):+.2f} (Polarization = {agent_dict.get('polarization_magnitude', 0.0):.2f})

## 2. Hypothetical Intervention (do-operation):
{json.dumps(intervention, indent=2)}

## 3. Query:
Under the Structural Causal Model, calculate the counterfactual outcome Y_{{do(X)}}(u) had this agent undergone the specified intervention while holding exogenous background factors U constant.
Output the estimated counterfactual polarization, individual treatment effect (ITE), and causal mechanism justification.
"""
