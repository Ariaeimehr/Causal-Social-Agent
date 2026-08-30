"""
Unit tests for causal_prompt_builder
"""

import unittest
from social_environment_simulator.simulator import SocialEnvironmentSimulator, SimulationConfig
from social_environment_simulator.network import NetworkType
from causal_prompt_builder.log_extractor import InteractionLogExtractor
from causal_prompt_builder.builder import CausalPromptBuilder


class TestCausalPromptBuilder(unittest.TestCase):
    def test_feature_extraction_and_prompt_building(self):
        config = SimulationConfig(
            topic="Renewable Energy Mandates",
            num_agents=8,
            num_timesteps=3,
            network_type=NetworkType.ERDOS_RENYI,
        )
        sim = SocialEnvironmentSimulator(config)
        res = sim.run_simulation()
        
        extractor = InteractionLogExtractor(res)
        features = extractor.extract_features()
        self.assertEqual(len(features.agent_records), 8)
        self.assertIn("polarization_magnitude", features.agent_records[0])
        self.assertIn("misinfo_cumulative_dose", features.agent_records[0])
        
        builder = CausalPromptBuilder(features, {"topic": config.topic, "network_type": config.network_type.value})
        prompt = builder.build_scm_discovery_prompt()
        self.assertIn("Structural Causal Model", prompt)
        self.assertIn("Renewable Energy Mandates", prompt)


if __name__ == "__main__":
    unittest.main()
