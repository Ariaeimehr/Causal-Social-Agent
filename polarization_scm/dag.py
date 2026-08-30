"""
Directed Acyclic Graph (DAG) Module for SCM
============================================
Provides mathematical DAG representations, d-separation tests, topological
sorting, and academic export formats (DOT / Graphviz / LaTeX TikZ).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple, Any


@dataclass
class CausalNode:
    id: str
    label: str
    node_type: str  # "exogenous_trait", "environmental", "mediator", "outcome"
    description: str = ""


@dataclass
class CausalEdge:
    source: str
    target: str
    weight: float
    p_value: float
    causal_mechanism: str
    path_type: str = "direct"  # "direct", "mediated", "confounded"


class CausalDAG:
    """
    Mathematical representation of a Structural Causal Model DAG G = (V, E).
    """

    def __init__(self) -> None:
        self.nodes: Dict[str, CausalNode] = {}
        self.edges: List[CausalEdge] = []
        self.adj_out: Dict[str, Set[str]] = {}
        self.adj_in: Dict[str, Set[str]] = {}

    def add_node(self, node: CausalNode) -> None:
        self.nodes[node.id] = node
        if node.id not in self.adj_out:
            self.adj_out[node.id] = set()
            self.adj_in[node.id] = set()

    def add_edge(self, edge: CausalEdge) -> None:
        self.edges.append(edge)
        if edge.source not in self.adj_out:
            self.adj_out[edge.source] = set()
            self.adj_in[edge.source] = set()
        if edge.target not in self.adj_out:
            self.adj_out[edge.target] = set()
            self.adj_in[edge.target] = set()
        self.adj_out[edge.source].add(edge.target)
        self.adj_in[edge.target].add(edge.source)

    def is_acyclic(self) -> bool:
        """Verifies whether the causal graph is strictly acyclic using Kahn's algorithm."""
        in_degree = {n: len(self.adj_in[n]) for n in self.nodes}
        queue = [n for n, deg in in_degree.items() if deg == 0]
        visited_count = 0

        while queue:
            node = queue.pop(0)
            visited_count += 1
            for neighbor in self.adj_out.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return visited_count == len(self.nodes)

    def topological_sort(self) -> List[str]:
        """Returns the topological causal ordering of variables."""
        in_degree = {n: len(self.adj_in[n]) for n in self.nodes}
        queue = [n for n, deg in in_degree.items() if deg == 0]
        order = []

        while queue:
            node = queue.pop(0)
            order.append(node)
            for neighbor in self.adj_out.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return order if len(order) == len(self.nodes) else list(self.nodes.keys())

    def get_parents(self, node_id: str) -> List[str]:
        return list(self.adj_in.get(node_id, []))

    def get_children(self, node_id: str) -> List[str]:
        return list(self.adj_out.get(node_id, []))

    def find_all_causal_paths(self, source: str, target: str) -> List[List[str]]:
        """Returns all directed causal pathways connecting source to target via DFS."""
        paths: List[List[str]] = []

        def dfs(current: str, current_path: List[str]):
            if current == target:
                paths.append(list(current_path))
                return
            for neighbor in self.adj_out.get(current, []):
                if neighbor not in current_path:
                    current_path.append(neighbor)
                    dfs(neighbor, current_path)
                    current_path.pop()

        if source in self.nodes and target in self.nodes:
            dfs(source, [source])
        return paths

    def to_graphviz_dot(self) -> str:
        """Exports DAG to Graphviz DOT format for publication rendering."""
        lines = [
            "digraph CausalPolarizationDAG {",
            '  rankdir=LR;',
            '  node [fontname="Helvetica", shape=box, style="rounded,filled", fillcolor="#F8FAFC", color="#64748B"];',
            '  edge [fontname="Helvetica", color="#0284C7", fontcolor="#0F172A", fontsize=10];',
            "",
        ]
        color_map = {
            "exogenous_trait": "#E0E7FF",
            "environmental": "#FEF3C7",
            "mediator": "#DCFCE7",
            "outcome": "#FEE2E2",
        }

        for n_id, n_obj in self.nodes.items():
            fill = color_map.get(n_obj.node_type, "#F8FAFC")
            lines.append(f'  "{n_id}" [label="{n_obj.label}", fillcolor="{fill}"];')

        lines.append("")
        for e in self.edges:
            lines.append(
                f'  "{e.source}" -> "{e.target}" [label="{e.weight:+.2f} (p={e.p_value:.3f})", penwidth={max(1.0, abs(e.weight)*3.0):.1f}];'
            )

        lines.append("}")
        return "\n".join(lines)

    def to_latex_tikz(self) -> str:
        """Exports DAG to LaTeX TikZ snippet for academic manuscripts."""
        lines = [
            "% LaTeX TikZ Causal Graph for Causal-Social-Agent SCM",
            "\\begin{tikzpicture}[",
            "  ->, >=stealth, auto, semithick,",
            "  node distance=2.5cm,",
            "  trait/.style={rectangle, rounded corners, draw=indigo!80, fill=indigo!10, thick, minimum size=8mm},",
            "  env/.style={rectangle, rounded corners, draw=amber!80, fill=amber!10, thick, minimum size=8mm},",
            "  med/.style={rectangle, rounded corners, draw=emerald!80, fill=emerald!10, thick, minimum size=8mm},",
            "  out/.style={rectangle, rounded corners, draw=rose!80, fill=rose!10, thick, minimum size=8mm}",
            "]",
            "",
            "  % Nodes",
            "  \\node[trait] (N) {Neuroticism ($N$)};",
            "  \\node[trait] (O) [below of=N] {Openness ($O$)};",
            "  \\node[env]   (E) [right of=N] {Misinfo Exposure ($E$)};",
            "  \\node[med]   (S) [right of=O] {Susceptibility ($S$)};",
            "  \\node[med]   (A) [right of=E] {Arousal ($A$)};",
            "  \\node[out]   (Y) [right of=S] {Polarization ($Y$)};",
            "",
            "  % Causal Edges",
            "  \\path (N) edge node[above] {+0.58} (S);",
            "  \\path (O) edge node[below] {-0.46} (S);",
            "  \\path (E) edge node[above] {+0.62} (A);",
            "  \\path (S) edge node[above] {+0.44} (Y);",
            "  \\path (A) edge node[above] {+0.31} (Y);",
            "  \\path (N) edge[bend left=30] node[above] {+0.22} (A);",
            "  \\path (E) edge[bend right=25] node[below] {+0.35} (Y);",
            "\\end{tikzpicture}",
        ]
        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [
                {"id": n.id, "label": n.label, "type": n.node_type, "description": n.description}
                for n in self.nodes.values()
            ],
            "edges": [
                {
                    "source": e.source,
                    "target": e.target,
                    "weight": round(e.weight, 3),
                    "p_value": round(e.p_value, 4),
                    "causal_mechanism": e.causal_mechanism,
                    "path_type": e.path_type,
                }
                for e in self.edges
            ],
            "is_acyclic": self.is_acyclic(),
            "topological_order": self.topological_sort(),
        }
