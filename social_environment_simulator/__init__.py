"""
Social Environment Simulator Module
====================================
A multi-agent simulation framework modeling opinion polarization,
misinformation contagion, and personality-driven susceptibility in
complex social network topologies.
"""

from .agent import AgentPersonality, SocialAgent
from .network import SocialNetworkTopology, NetworkType
from .simulator import SocialEnvironmentSimulator, SimulationConfig, SimulationResult

__all__ = [
    "AgentPersonality",
    "SocialAgent",
    "SocialNetworkTopology",
    "NetworkType",
    "SocialEnvironmentSimulator",
    "SimulationConfig",
    "SimulationResult",
]
