"""
Causal Prompt Templates Module
===============================
Standardizes prompt formulations grounded in Pearl's Structural Causal Models (SCM),
d-separation theory, and do-calculus intervention queries.
"""

from enum import Enum
from typing import Dict, Any


class CausalPromptFormat(str, Enum):
    SCM_DISCOVERY = "scm_discovery"
    COUNTERFACTUAL_QUERY = "counterfactual_query"
    MEDIATION_ANALYSIS = "mediation_analysis"


class SCMPromptTemplate:
    """
    Template repository for generating structured LLM Causal Oracle prompts.
    """

    SYSTEM_INSTRUCTION = """You are an expert Causal Inference and Computational Social Science Oracle specializing in Judea Pearl's Structural Causal Models (SCM), Directed Acyclic Graphs (DAGs), and Social Network Opinion Dynamics under Cognitive Warfare and Misinformation.

Your task is to analyze empirical agent simulation data, discover the underlying Structural Causal Model, identify causal directions, potential confounders, and estimate causal path coefficients between:
1. Exogenous/Endogenous Personality Traits (Neuroticism, Openness, Conscientiousness)
2. Exposure to Misinformation (Network Position, Dose, Virulence)
3. Mediating Cognitive States (Susceptibility, Emotional Arousal)
4. Outcome Variable: Opinion Polarization (Polarization Magnitude, Bimodality Shift)

You must output strictly validated JSON conforming to the requested schema.
"""

    DISCOVERY_TEMPLATE = """# RESEARCH STUDY: Structural Causal Model of Opinion Polarization & Misinformation Spread

## 1. Domain Context & Target Variables
We modeled an interconnected collective of {num_agents} LLM agents discussing '{topic}' over {total_timesteps} discrete interaction rounds on a {network_type} network.
At timestep t = {injection_step}, a coordinated misinformation shock (Virulence = {virulence}) was injected into the network.

## 2. Empirical Statistical Observations
### A. Variable Correlation Matrix:
{correlation_matrix_str}

### B. Trait-Stratified Empirical Outcomes:
- Pre-Injection Polarization (Esteban-Ray): {pre_injection_polarization}
- Post-Injection Polarization (Esteban-Ray): {post_injection_polarization}
- Polarization Amplification Ratio: {amplification_ratio}x
- High-Neuroticism Agents Mean Polarization: {high_neuro_pol}
- Low-Neuroticism Agents Mean Polarization: {low_neuro_pol}
- High-Openness Agents Mean Polarization: {high_open_pol}
- Systemic Bimodality Coefficient: {bimodality_coeff}

### C. Sample Agent Trajectories (Top Extreme Shifts):
{sample_agents_table}

## 3. Causal Discovery Objectives
Discover the complete Directed Acyclic Graph (DAG) G = (V, E) and the structural equations X_i := f_i(PA_i, U_i).

Please provide your response in the following strict JSON schema:
{{
  "dag": {{
    "nodes": [
      {{"id": "Personality_Neuroticism", "label": "Neuroticism (N)", "type": "exogenous_trait"}},
      {{"id": "Personality_Openness", "label": "Openness (O)", "type": "exogenous_trait"}},
      {{"id": "Network_Exposure", "label": "Misinformation Exposure (E)", "type": "environmental"}},
      {{"id": "Susceptibility", "label": "Cognitive Susceptibility (S)", "type": "mediator"}},
      {{"id": "Emotional_Arousal", "label": "Emotional Arousal (A)", "type": "mediator"}},
      {{"id": "Opinion_Polarization", "label": "Opinion Polarization (Y)", "type": "outcome"}}
    ],
    "edges": [
      {{
        "source": "Personality_Neuroticism",
        "target": "Susceptibility",
        "weight": 0.58,
        "p_value": 0.001,
        "causal_mechanism": "High emotional volatility impairs critical verification, elevating baseline susceptibility.",
        "path_type": "direct"
      }}
    ]
  }},
  "structural_equations": [
    {{
      "target_variable": "Susceptibility (S)",
      "latex": "S := \\\\sigma(1.42 \\\\cdot N - 1.18 \\\\cdot O + 0.35 \\\\cdot U_S)",
      "functional_form": "Sigmoidal trait aggregation",
      "r_squared": 0.76
    }},
    {{
      "target_variable": "Opinion_Polarization (Y)",
      "latex": "Y := 0.44 \\\\cdot S \\\\cdot E + 0.31 \\\\cdot A + 0.18 \\\\cdot N + U_Y",
      "functional_form": "Interaction between susceptibility, exposure dose, and emotional arousal",
      "r_squared": 0.84
    }}
  ],
  "causal_hypotheses_evaluation": [
    {{
      "hypothesis": "H1: Neuroticism exerts a positive direct effect on Opinion Polarization.",
      "supported": true,
      "estimated_ate": 0.38,
      "theoretical_justification": "Neurotic agents experience higher anxiety-induced radicalization when exposed to alarmist claims."
    }},
    {{
      "hypothesis": "H2: Openness buffers against misinformation-induced polarization via cognitive deliberation.",
      "supported": true,
      "estimated_ate": -0.29,
      "theoretical_justification": "High openness fosters exploration of disconfirming evidence, attenuating echo-chamber anchoring."
    }}
  ],
  "counterfactual_analysis": {{
    "intervention_query": "P(Polarization | do(Misinformation_Exposure = 0))",
    "counterfactual_outcome": "Polarization drops by approximately 62%, maintaining baseline deliberation without bifurcated ideological camps.",
    "policy_recommendation": "Pre-bunking literacy interventions targeting high-neuroticism social network clusters reduce systemic polarization by 45%."
  }}
}}
"""
