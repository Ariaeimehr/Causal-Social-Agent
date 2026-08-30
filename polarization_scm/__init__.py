"""
Polarization Structural Causal Model (SCM) Module
==================================================
Interfaces with Gemini API as a Causal Oracle to discover Directed Acyclic
Graphs (DAGs), structural equations, and evaluate counterfactual interventions
under Judea Pearl's Causal Hierarchy.
"""

from .causal_oracle import GeminiCausalOracle, OracleResult
from .dag import CausalDAG, CausalNode, CausalEdge
from .scm_evaluator import StructuralCausalModel, TreatmentEffectResult

__all__ = [
    "GeminiCausalOracle",
    "OracleResult",
    "CausalDAG",
    "CausalNode",
    "CausalEdge",
    "StructuralCausalModel",
    "TreatmentEffectResult",
]
