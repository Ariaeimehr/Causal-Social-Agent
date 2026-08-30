"""
Unit tests for polarization_scm
"""

import unittest
from polarization_scm.dag import CausalDAG, CausalNode, CausalEdge
from polarization_scm.scm_evaluator import StructuralCausalModel


class TestPolarizationSCM(unittest.TestCase):
    def test_causal_dag_properties(self):
        dag = CausalDAG()
        dag.add_node(CausalNode(id="X", label="Treatment", node_type="exogenous_trait"))
        dag.add_node(CausalNode(id="M", label="Mediator", node_type="mediator"))
        dag.add_node(CausalNode(id="Y", label="Outcome", node_type="outcome"))
        
        dag.add_edge(CausalEdge(source="X", target="M", weight=0.6, p_value=0.01, causal_mechanism="X affects M"))
        dag.add_edge(CausalEdge(source="M", target="Y", weight=0.5, p_value=0.01, causal_mechanism="M affects Y"))
        dag.add_edge(CausalEdge(source="X", target="Y", weight=0.3, p_value=0.05, causal_mechanism="Direct path"))
        
        self.assertTrue(dag.is_acyclic())
        self.assertEqual(dag.topological_sort(), ["X", "M", "Y"])
        self.assertEqual(len(dag.find_all_causal_paths("X", "Y")), 2)
        
        dot_str = dag.to_graphviz_dot()
        self.assertIn("digraph CausalPolarizationDAG", dot_str)
        
        tikz_str = dag.to_latex_tikz()
        self.assertIn("\\begin{tikzpicture}", tikz_str)

    def test_scm_evaluator_counterfactual(self):
        dag = CausalDAG()
        evaluator = StructuralCausalModel(dag)
        
        factual = {
            "agent_id": "agent_0",
            "neuroticism": 0.8,
            "openness": 0.2,
            "misinfo_cumulative_dose": 1.5,
            "polarization_magnitude": 0.9,
        }
        
        cf_res = evaluator.evaluate_counterfactual(
            factual_agent=factual,
            intervention={"misinfo_cumulative_dose": 0.0, "openness": 0.8},
        )
        
        self.assertIn("counterfactual_polarization", cf_res)
        self.assertLess(cf_res["counterfactual_polarization"], factual["polarization_magnitude"])
        self.assertLess(cf_res["individual_treatment_effect"], 0)


if __name__ == "__main__":
    unittest.main()
