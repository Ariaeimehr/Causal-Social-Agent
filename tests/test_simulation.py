"""
Unit tests for social_environment_simulator
"""

import unittest
from social_environment_simulator.agent import SocialAgent, AgentPersonality
from social_environment_simulator.network import SocialNetworkTopology, NetworkType
from social_environment_simulator.simulator import (
    SocialEnvironmentSimulator,
    SimulationConfig,
)


class TestSocialEnvironmentSimulator(unittest.TestCase):
    def test_agent_initialization(self):
        personality = AgentPersonality(
            openness=0.8,
            conscientiousness=0.7,
            extraversion=0.6,
            agreeableness=0.5,
            neuroticism=0.3,
            confirmation_bias=0.4,
            cognitive_reflectivity=0.75,
        )
        agent = SocialAgent(
            agent_id="test_0",
            name="Test Agent",
            role="Researcher",
            personality=personality,
            initial_opinion=0.2,
        )
        
        self.assertEqual(agent.agent_id, "test_0")
        self.assertEqual(agent.opinion, 0.2)
        self.assertLess(agent.susceptibility, 0.6)

    def test_network_generation(self):
        net_gen = SocialNetworkTopology(num_agents=12, network_type=NetworkType.ECHO_CHAMBER, seed=42)
        self.assertEqual(len(net_gen.adj), 12)
        
        net_sw = SocialNetworkTopology(num_agents=12, network_type=NetworkType.SMALL_WORLD, seed=42)
        self.assertEqual(len(net_sw.adj), 12)

    def test_simulation_execution(self):
        config = SimulationConfig(
            topic="Vaccine Mandates",
            num_agents=10,
            num_timesteps=4,
            network_type=NetworkType.SMALL_WORLD,
            misinformation_injection_step=2,
            misinformation_virulence=0.8,
        )
        sim = SocialEnvironmentSimulator(config)
        res = sim.run_simulation()
        
        self.assertEqual(len(res.trajectory), 4)
        self.assertEqual(len(res.polarization_series), 5)  # t=0 baseline + 4 steps
        self.assertGreater(len(res.agents), 0)


if __name__ == "__main__":
    unittest.main()
