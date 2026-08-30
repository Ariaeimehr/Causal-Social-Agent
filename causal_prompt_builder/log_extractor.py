"""
Interaction Log Extractor
==========================
Parses raw simulation results and converts multi-agent time-series event streams
into structured observational datasets and statistical summaries for causal inference.
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Any

from social_environment_simulator.simulator import SimulationResult


@dataclass
class ExtractedCausalFeatures:
    """Structured observational features ready for SCM graph discovery."""
    agent_records: List[Dict[str, Any]]
    dyad_records: List[Dict[str, Any]]
    temporal_summary: Dict[str, Any]
    correlation_matrix: Dict[str, Dict[str, float]]
    intervention_summary: Dict[str, Any]

    @property
    def agent_df(self):
        """Returns records as list of dicts or pandas DataFrame if available."""
        return self.agent_records


class InteractionLogExtractor:
    """
    Extracts time-series interaction logs, sentiment shifts, trait correlations,
    and exposure doses from simulation outcomes.
    """

    def __init__(self, simulation_result: SimulationResult) -> None:
        self.result = simulation_result

    def extract_features(self) -> ExtractedCausalFeatures:
        """Processes agent histories and interaction events into tabular records."""
        agent_records = []
        
        for agent_id, agent in self.result.agents.items():
            init_op = agent.opinion_history[0]
            final_op = agent.opinion_history[-1]
            opinion_shift = final_op - init_op
            polarization_contribution = abs(final_op) - abs(init_op)
            
            p = agent.personality
            agent_records.append({
                "agent_id": agent_id,
                "role": agent.role,
                "neuroticism": p.neuroticism,
                "openness": p.openness,
                "conscientiousness": p.conscientiousness,
                "agreeableness": p.agreeableness,
                "extraversion": p.extraversion,
                "confirmation_bias": p.confirmation_bias,
                "cognitive_reflectivity": p.cognitive_reflectivity,
                "susceptibility": agent.susceptibility,
                "misinfo_exposure_count": agent.exposure_to_misinformation_count,
                "misinfo_cumulative_dose": agent.cumulative_misinformation_dose,
                "emotional_arousal": agent.emotional_arousal,
                "initial_opinion": init_op,
                "final_opinion": final_op,
                "opinion_shift": opinion_shift,
                "polarization_magnitude": abs(final_op),
                "polarization_delta": polarization_contribution,
            })

        # Extract dyadic interaction logs
        dyad_records = []
        for ev in self.result.interaction_events:
            sender = self.result.agents.get(ev.get("sender", ""))
            recipient = self.result.agents.get(ev.get("recipient", ""))
            if sender and recipient:
                dyad_records.append({
                    "timestep": ev.get("timestep", 0),
                    "sender_id": ev.get("sender"),
                    "recipient_id": ev.get("recipient"),
                    "event_type": ev.get("type"),
                    "is_misinformation": ev.get("type") == "MISINFORMATION_EXPOSURE",
                    "sender_opinion": sender.opinion,
                    "recipient_opinion": recipient.opinion,
                    "recipient_susceptibility": recipient.susceptibility,
                    "recipient_neuroticism": recipient.personality.neuroticism,
                    "recipient_openness": recipient.personality.openness,
                })

        # Correlation calculation helper
        corr_cols = [
            "neuroticism",
            "openness",
            "susceptibility",
            "misinfo_cumulative_dose",
            "emotional_arousal",
            "polarization_magnitude",
        ]
        
        corr_clean: Dict[str, Dict[str, float]] = {}
        for c1 in corr_cols:
            corr_clean[c1] = {}
            for c2 in corr_cols:
                vals1 = [r[c1] for r in agent_records]
                vals2 = [r[c2] for r in agent_records]
                n = len(vals1)
                m1 = sum(vals1) / n
                m2 = sum(vals2) / n
                cov = sum((v1 - m1) * (v2 - m2) for v1, v2 in zip(vals1, vals2))
                var1 = sum((v1 - m1) ** 2 for v1 in vals1)
                var2 = sum((v2 - m2) ** 2 for v2 in vals2)
                denom = math.sqrt(var1 * var2) if var1 > 0 and var2 > 0 else 1.0
                r_val = cov / denom if denom != 0 else 0.0
                corr_clean[c1][c2] = round(r_val, 4)

        inj_step = self.result.config.misinformation_injection_step
        pre_pol = self.result.polarization_series[max(0, inj_step - 1)] if len(self.result.polarization_series) >= inj_step else 0.0
        post_pol = self.result.polarization_series[-1]

        high_neuro = [r["polarization_magnitude"] for r in agent_records if r["neuroticism"] > 0.6]
        low_neuro = [r["polarization_magnitude"] for r in agent_records if r["neuroticism"] <= 0.6]
        high_open = [r["polarization_magnitude"] for r in agent_records if r["openness"] > 0.6]

        intervention_summary = {
            "injection_timestep": inj_step,
            "pre_injection_polarization": round(pre_pol, 4),
            "post_injection_polarization": round(post_pol, 4),
            "polarization_amplification_ratio": round(post_pol / max(1e-4, pre_pol), 3),
            "mean_susceptibility": round(sum(r["susceptibility"] for r in agent_records) / len(agent_records), 4),
            "high_neuroticism_avg_polarization": round(sum(high_neuro) / max(1, len(high_neuro)), 4),
            "low_neuroticism_avg_polarization": round(sum(low_neuro) / max(1, len(low_neuro)), 4),
            "high_openness_avg_polarization": round(sum(high_open) / max(1, len(high_open)), 4),
        }

        temporal_summary = {
            "total_timesteps": len(self.result.trajectory),
            "total_interactions": len(self.result.interaction_events),
            "final_bimodality_coeff": self.result.bimodality_series[-1],
            "peak_polarization_step": self.result.polarization_series.index(max(self.result.polarization_series)),
        }

        return ExtractedCausalFeatures(
            agent_records=agent_records,
            dyad_records=dyad_records,
            temporal_summary=temporal_summary,
            correlation_matrix=corr_clean,
            intervention_summary=intervention_summary,
        )
