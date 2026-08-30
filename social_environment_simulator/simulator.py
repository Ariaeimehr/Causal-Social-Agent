"""
Simulator Engine Module
========================
Coordinates agent interaction rounds, structured misinformation shocks,
opinion aggregation, and Esteban-Ray polarization index computation.
"""

import math
import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable

from .agent import SocialAgent, AgentPersonality, Message
from .network import SocialNetworkTopology, NetworkType


def _clip(val: float, low: float, high: float) -> float:
    return max(low, min(high, float(val)))


@dataclass
class SimulationConfig:
    """Configuration parameters for the multi-agent causal social simulation."""
    topic: str = "Mandatory Algorithmic AI Governance & Surveillance"
    num_agents: int = 24
    num_timesteps: int = 15
    network_type: NetworkType = NetworkType.ECHO_CHAMBER
    misinformation_injection_step: int = 4
    misinformation_virulence: float = 0.85
    misinformation_target_stance: float = -0.90  # Stance pushed by misinfo payload
    random_seed: int = 42
    mean_neuroticism: float = 0.55
    mean_openness: float = 0.50
    mean_confirmation_bias: float = 0.60


@dataclass
class SimulationResult:
    """Encapsulates the complete trajectory, interaction logs, and metrics of a simulation run."""
    config: SimulationConfig
    agents: Dict[str, SocialAgent]
    topology: SocialNetworkTopology
    trajectory: List[Dict[str, Any]]
    polarization_series: List[float]
    bimodality_series: List[float]
    misinformation_exposure_series: List[float]
    interaction_events: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "config": {
                "topic": self.config.topic,
                "num_agents": self.config.num_agents,
                "num_timesteps": self.config.num_timesteps,
                "network_type": self.config.network_type.value,
                "misinformation_injection_step": self.config.misinformation_injection_step,
                "misinformation_virulence": self.config.misinformation_virulence,
                "misinformation_target_stance": self.config.misinformation_target_stance,
            },
            "graph_metrics": self.topology.get_graph_metrics(),
            "graph_data": self.topology.to_adjacency_data(),
            "polarization_series": [round(p, 4) for p in self.polarization_series],
            "bimodality_series": [round(b, 4) for b in self.bimodality_series],
            "misinformation_exposure_series": [round(e, 4) for e in self.misinformation_exposure_series],
            "trajectory": self.trajectory,
            "agent_summaries": {k: v.to_dict() for k, v in self.agents.items()},
            "interaction_events": self.interaction_events[:200],
        }


class SocialEnvironmentSimulator:
    """
    Core discrete-time social simulator implementing opinion dynamics under misinformation shocks.
    """

    def __init__(self, config: Optional[SimulationConfig] = None) -> None:
        self.config = config or SimulationConfig()
        random.seed(self.config.random_seed)
        
        # Initialize network topology
        self.topology = SocialNetworkTopology(
            num_agents=self.config.num_agents,
            network_type=self.config.network_type,
            seed=self.config.random_seed,
        )
        
        # Initialize agents
        self.agents: Dict[str, SocialAgent] = self._instantiate_agents()

    def _instantiate_agents(self) -> Dict[str, SocialAgent]:
        """Creates heterogeneous agents with continuous OCEAN trait distributions."""
        agents = {}
        n = self.config.num_agents
        
        for i in range(n):
            agent_id = f"agent_{i}"
            cluster_side = 1.0 if i < n // 2 else -1.0
            init_op = _clip(cluster_side * 0.25 + random.gauss(0, 0.2), -0.85, 0.85)
            
            neuroticism = _clip(random.gauss(self.config.mean_neuroticism, 0.20), 0.05, 0.95)
            openness = _clip(random.gauss(self.config.mean_openness, 0.20), 0.05, 0.95)
            conscientiousness = _clip(random.gauss(0.55, 0.18), 0.05, 0.95)
            extraversion = _clip(random.gauss(0.50, 0.20), 0.05, 0.95)
            agreeableness = _clip(random.gauss(0.50, 0.18), 0.05, 0.95)
            conf_bias = _clip(random.gauss(self.config.mean_confirmation_bias, 0.15), 0.10, 0.95)
            cog_reflect = _clip(random.gauss(0.50, 0.20), 0.05, 0.95)

            personality = AgentPersonality(
                openness=openness,
                conscientiousness=conscientiousness,
                extraversion=extraversion,
                agreeableness=agreeableness,
                neuroticism=neuroticism,
                confirmation_bias=conf_bias,
                cognitive_reflectivity=cog_reflect,
            )

            role_names = ["Analyst", "Citizen", "Community Organiser", "Journalist", "Student", "Advocate"]
            role = role_names[i % len(role_names)]
            
            agents[agent_id] = SocialAgent(
                agent_id=agent_id,
                name=f"Agent-{i:02d} ({role})",
                personality=personality,
                initial_opinion=init_op,
                role=role,
            )
            
        return agents

    @staticmethod
    def compute_esteban_ray_polarization(opinions: List[float], alpha: float = 1.6, k: float = 1.0) -> float:
        """
        Computes the Esteban-Ray (1994) Polarization Index:
        P_ER(α) = k * ∑_i ∑_j π_i^{1+α} π_j |y_i - y_j|
        """
        n = len(opinions)
        if n <= 1:
            return 0.0
        
        pi = 1.0 / n
        total_p = 0.0
        for y_i in opinions:
            for y_j in opinions:
                total_p += (pi ** (1.0 + alpha)) * pi * abs(y_i - y_j)
        return float(k * total_p * 10.0)

    @staticmethod
    def compute_sarle_bimodality_coefficient(opinions: List[float]) -> float:
        """
        Computes Sarle's Bimodality Coefficient (BC):
        BC = (γ^2 + 1) / (κ + 3 * (n-1)^2 / ((n-2)(n-3)))
        """
        n = len(opinions)
        if n < 4:
            return 0.5
        
        mean_val = sum(opinions) / n
        variance = sum((x - mean_val) ** 2 for x in opinions) / n
        std = math.sqrt(variance)
        if std < 1e-6:
            return 0.0
        
        skew = sum(((x - mean_val) / std) ** 3 for x in opinions) / n
        kurt = sum(((x - mean_val) / std) ** 4 for x in opinions) / n - 3.0
        
        sample_correction = 3.0 * ((n - 1) ** 2) / ((n - 2) * (n - 3))
        bc = (skew ** 2 + 1.0) / (kurt + sample_correction)
        return _clip(bc, 0.0, 1.0)

    def run_simulation(self, step_callback: Optional[Callable[[int, Dict[str, Any]], None]] = None) -> SimulationResult:
        """
        Executes the discrete-time multi-agent simulation run across T timesteps.
        """
        trajectory: List[Dict[str, Any]] = []
        polarization_series: List[float] = []
        bimodality_series: List[float] = []
        misinformation_exposure_series: List[float] = []
        interaction_events: List[Dict[str, Any]] = []

        # Record t=0 baseline
        initial_opinions = [agent.opinion for agent in self.agents.values()]
        p0 = self.compute_esteban_ray_polarization(initial_opinions)
        b0 = self.compute_sarle_bimodality_coefficient(initial_opinions)
        polarization_series.append(p0)
        bimodality_series.append(b0)
        misinformation_exposure_series.append(0.0)

        for t in range(1, self.config.num_timesteps + 1):
            is_shock_step = (t == self.config.misinformation_injection_step)
            step_messages: List[Message] = []
            
            # Step A: Inject coordinated misinformation shock if scheduled
            if is_shock_step:
                susceptible_agents = sorted(
                    self.agents.values(),
                    key=lambda a: a.susceptibility,
                    reverse=True
                )[:max(2, int(self.config.num_agents * 0.20))]
                
                for seeder in susceptible_agents:
                    shock_msg = Message(
                        sender_id=seeder.agent_id,
                        recipient_id=None,
                        timestep=t,
                        content=(
                            f"[DISINFORMATION SHOCK] Leaked verified dossiers prove {self.config.topic} "
                            f"is intentionally manufactured to deceive citizens. Immediate mobilization required!"
                        ),
                        sentiment=-0.95,
                        is_misinformation=True,
                        virulence=self.config.misinformation_virulence,
                        topic_stance=self.config.misinformation_target_stance,
                    )
                    step_messages.append(shock_msg)
                    neighbors = self.topology.get_neighbors(seeder.agent_id)
                    for n_id in neighbors:
                        if n_id in self.agents:
                            self.agents[n_id].receive_message(shock_msg)
                            interaction_events.append({
                                "timestep": t,
                                "sender": seeder.agent_id,
                                "sender_name": seeder.name,
                                "recipient": n_id,
                                "recipient_name": self.agents[n_id].name,
                                "type": "MISINFORMATION_EXPOSURE",
                                "virulence": self.config.misinformation_virulence,
                                "content": shock_msg.content,
                            })

            # Step B: Regular peer utterances
            for agent_id, agent in self.agents.items():
                utterance = agent.generate_utterance(self.config.topic, t)
                step_messages.append(utterance)
                
                neighbors = self.topology.get_neighbors(agent_id)
                for neighbor_id in neighbors:
                    if neighbor_id in self.agents:
                        self.agents[neighbor_id].receive_message(utterance)
                        interaction_events.append({
                            "timestep": t,
                            "sender": agent_id,
                            "sender_name": agent.name,
                            "recipient": neighbor_id,
                            "recipient_name": self.agents[neighbor_id].name,
                            "type": "PEER_INTERACTION",
                            "stance": utterance.topic_stance,
                            "sentiment": utterance.sentiment,
                            "content": utterance.content,
                        })

            # Step C: Inbox processing & belief updates
            step_agent_states = {}
            for agent_id, agent in self.agents.items():
                state_update = agent.process_inbox_and_update_belief(t)
                step_agent_states[agent_id] = {
                    "opinion": agent.opinion,
                    "delta": state_update["delta_opinion"],
                    "arousal": agent.emotional_arousal,
                    "misinfo_dose": agent.cumulative_misinformation_dose,
                }

            # Step D: Compute systemic metrics
            current_opinions = [a.opinion for a in self.agents.values()]
            p_val = self.compute_esteban_ray_polarization(current_opinions)
            b_val = self.compute_sarle_bimodality_coefficient(current_opinions)
            mean_op = sum(current_opinions) / len(current_opinions)
            total_misinfo_dose = sum(a.cumulative_misinformation_dose for a in self.agents.values()) / len(self.agents)
            
            polarization_series.append(p_val)
            bimodality_series.append(b_val)
            misinformation_exposure_series.append(total_misinfo_dose)

            step_summary = {
                "timestep": t,
                "polarization_index": round(p_val, 4),
                "bimodality_coeff": round(b_val, 4),
                "mean_opinion": round(mean_op, 4),
                "mean_misinfo_dose": round(total_misinfo_dose, 4),
                "agent_states": step_agent_states,
            }
            trajectory.append(step_summary)

            if step_callback:
                step_callback(t, step_summary)

        return SimulationResult(
            config=self.config,
            agents=self.agents,
            topology=self.topology,
            trajectory=trajectory,
            polarization_series=polarization_series,
            bimodality_series=bimodality_series,
            misinformation_exposure_series=misinformation_exposure_series,
            interaction_events=interaction_events,
        )
