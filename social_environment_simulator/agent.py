"""
Agent Module for Causal Social Simulation
==========================================
Defines the `SocialAgent` and `AgentPersonality` classes. Each agent possesses
a continuous Big-Five personality vector (OCEAN), psychological defense traits,
and an opinion score θ ∈ [-1.0, 1.0].
"""

import math
import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

try:
    import numpy as np
except ImportError:
    np = None


def _clip(val: float, low: float, high: float) -> float:
    return max(low, min(high, float(val)))


@dataclass
class AgentPersonality:
    """
    Big-Five (OCEAN) Personality Vector and Cognitive Bias Trait Profile.
    
    Attributes:
        openness: [0.0, 1.0] - Cognitive flexibility and openness to counter-attitudinal arguments.
        conscientiousness: [0.0, 1.0] - Tendency to verify claims and seek evidence.
        extraversion: [0.0, 1.0] - Outgoing communication frequency and influence radius.
        agreeableness: [0.0, 1.0] - Tendency toward social consensus and peer conformity.
        neuroticism: [0.0, 1.0] - Emotional reactivity, anxiety, and vulnerability to alarmist misinformation.
        confirmation_bias: [0.0, 1.0] - Prior belief anchoring strength.
        cognitive_reflectivity: [0.0, 1.0] - Analytical processing vs intuitive heuristic reliance.
    """
    openness: float = 0.5
    conscientiousness: float = 0.5
    extraversion: float = 0.5
    agreeableness: float = 0.5
    neuroticism: float = 0.5
    confirmation_bias: float = 0.6
    cognitive_reflectivity: float = 0.5

    def compute_misinformation_susceptibility(self) -> float:
        """
        Computes endogenous misinformation susceptibility S_i using structural psychometric weighting:
        S_i = σ( 1.4 * Neuroticism - 1.2 * Openness - 1.0 * Conscientiousness - 1.1 * Cognition + 0.9 * ConfBias )
        """
        raw_score = (
            1.4 * self.neuroticism
            - 1.2 * self.openness
            - 1.0 * self.conscientiousness
            - 1.1 * self.cognitive_reflectivity
            + 0.9 * self.confirmation_bias
        )
        # Sigmoidal mapping to [0.0, 1.0]
        return float(1.0 / (1.0 + math.exp(-raw_score)))

    def to_dict(self) -> Dict[str, float]:
        return {
            "openness": round(self.openness, 3),
            "conscientiousness": round(self.conscientiousness, 3),
            "extraversion": round(self.extraversion, 3),
            "agreeableness": round(self.agreeableness, 3),
            "neuroticism": round(self.neuroticism, 3),
            "confirmation_bias": round(self.confirmation_bias, 3),
            "cognitive_reflectivity": round(self.cognitive_reflectivity, 3),
        }


@dataclass
class Message:
    """Represents a conversational message/post transmitted in the social network."""
    sender_id: str
    recipient_id: Optional[str]  # None indicates broadcast to all neighbors
    timestep: int
    content: str
    sentiment: float  # [-1.0 (extremely hostile/negative) to +1.0 (affirmative/positive)]
    is_misinformation: bool = False
    virulence: float = 0.0  # Emotional contagion intensity [0.0, 1.0]
    topic_stance: float = 0.0  # [-1.0 to 1.0]


class SocialAgent:
    """
    Simulated LLM-powered agent residing in a social network node.
    
    Maintains internal opinion state θ_i(t), historical interaction logs,
    and updates beliefs based on peer exposure and cognitive traits.
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        personality: AgentPersonality,
        initial_opinion: float = 0.0,
        role: str = "Citizen",
    ) -> None:
        self.agent_id: str = agent_id
        self.name: str = name
        self.personality: AgentPersonality = personality
        self.opinion: float = _clip(initial_opinion, -1.0, 1.0)
        self.role: str = role
        
        # State tracking
        self.susceptibility: float = self.personality.compute_misinformation_susceptibility()
        self.opinion_history: List[float] = [self.opinion]
        self.exposure_to_misinformation_count: int = 0
        self.cumulative_misinformation_dose: float = 0.0
        self.emotional_arousal: float = 0.2
        self.message_inbox: List[Message] = []
        self.interaction_log: List[Dict[str, Any]] = []

    def receive_message(self, message: Message) -> None:
        """Appends an incoming message to the agent's inbox buffer for the current timestep."""
        self.message_inbox.append(message)
        if message.is_misinformation:
            self.exposure_to_misinformation_count += 1
            self.cumulative_misinformation_dose += message.virulence

    def process_inbox_and_update_belief(self, timestep: int) -> Dict[str, Any]:
        """
        Updates agent opinion θ_i(t) following bounded confidence and cognitive susceptibility dynamics.
        """
        if not self.message_inbox:
            self.opinion_history.append(self.opinion)
            return {
                "agent_id": self.agent_id,
                "timestep": timestep,
                "delta_opinion": 0.0,
                "new_opinion": self.opinion,
                "emotional_arousal": self.emotional_arousal,
            }

        prev_opinion = self.opinion
        total_peer_influence = 0.0
        misinfo_impact = 0.0
        active_sources = []

        for msg in self.message_inbox:
            active_sources.append(msg.sender_id)
            # Distance in opinion space
            opinion_diff = msg.topic_stance - self.opinion
            alignment = 1.0 - abs(opinion_diff) / 2.0  # [0, 1]
            
            # Confirmation bias weighting
            weight = (1.0 - self.personality.confirmation_bias) + (self.personality.confirmation_bias * alignment)
            # Agreeableness moderation
            weight *= (0.5 + 0.5 * self.personality.agreeableness)
            
            peer_shift = weight * 0.15 * opinion_diff
            total_peer_influence += peer_shift

            # Misinformation effect
            if msg.is_misinformation:
                misinfo_direction = 1.0 if msg.topic_stance >= 0 else -1.0
                effective_dose = self.susceptibility * msg.virulence * (1.0 + self.personality.neuroticism)
                misinfo_impact += effective_dose * 0.25 * misinfo_direction
                self.emotional_arousal = _clip(self.emotional_arousal + 0.15 * msg.virulence, 0.0, 1.0)

        # Update opinion with bounded noise
        noise = random.gauss(0, 0.02 * (1.0 - self.personality.conscientiousness))
        delta = total_peer_influence + misinfo_impact + noise
        self.opinion = _clip(self.opinion + delta, -1.0, 1.0)
        self.opinion_history.append(self.opinion)

        # Log transition
        step_log = {
            "agent_id": self.agent_id,
            "timestep": timestep,
            "prev_opinion": round(prev_opinion, 4),
            "new_opinion": round(self.opinion, 4),
            "delta_opinion": round(self.opinion - prev_opinion, 4),
            "inbox_size": len(self.message_inbox),
            "senders": active_sources,
            "cumulative_misinfo_dose": round(self.cumulative_misinformation_dose, 3),
            "emotional_arousal": round(self.emotional_arousal, 3),
            "susceptibility": round(self.susceptibility, 3),
        }
        self.interaction_log.append(step_log)
        
        # Clear inbox after processing
        self.message_inbox.clear()
        return step_log

    def generate_utterance(self, topic: str, timestep: int) -> Message:
        """
        Synthesizes a topical message reflecting the agent's current opinion stance and personality.
        """
        sentiment = float(math.tanh(self.opinion * 2.0))
        virulence = _clip(self.personality.neuroticism * 0.7 + abs(self.opinion) * 0.3, 0.0, 1.0)
        
        if self.opinion > 0.4:
            stance_desc = "strongly in favor of"
            tone = "assertive and urgent" if self.personality.neuroticism > 0.6 else "supportive"
        elif self.opinion < -0.4:
            stance_desc = "strongly opposed to"
            tone = "alarmist and critical" if self.personality.neuroticism > 0.6 else "skeptical"
        else:
            stance_desc = "moderate or neutral regarding"
            tone = "deliberative and inquisitive"

        content = (
            f"[{self.name} | Stance: {self.opinion:+.2f} | Tone: {tone}] "
            f"Regarding {topic}, I am {stance_desc} the standard consensus. "
            f"My stance is rooted in my current evaluation (Arousal: {self.emotional_arousal:.2f})."
        )

        return Message(
            sender_id=self.agent_id,
            recipient_id=None,
            timestep=timestep,
            content=content,
            sentiment=sentiment,
            is_misinformation=False,
            virulence=virulence,
            topic_stance=self.opinion,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "opinion": round(self.opinion, 4),
            "susceptibility": round(self.susceptibility, 4),
            "emotional_arousal": round(self.emotional_arousal, 4),
            "exposure_count": self.exposure_to_misinformation_count,
            "cumulative_dose": round(self.cumulative_misinformation_dose, 4),
            "personality": self.personality.to_dict(),
            "opinion_history": [round(x, 4) for x in self.opinion_history],
        }
