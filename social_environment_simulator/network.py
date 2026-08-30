"""
Network Topology Module for Social Environment Simulation
==========================================================
Generates realistic structural topologies for agent communication graphs:
- Scale-Free (Barabási-Albert)
- Small-World (Watts-Strogatz)
- Echo-Chamber / Clustered Community
- Erdős-Rényi Random Graph
"""

import random
from enum import Enum
from typing import Dict, List, Tuple, Set, Any


class NetworkType(str, Enum):
    SCALE_FREE = "scale_free"
    SMALL_WORLD = "small_world"
    ECHO_CHAMBER = "echo_chamber"
    ERDOS_RENYI = "erdos_renyi"


class SocialNetworkTopology:
    """
    Manages adjacency, community structures, homophily weights,
    and message routing for the social agent collective.
    """

    def __init__(
        self,
        num_agents: int = 20,
        network_type: NetworkType = NetworkType.ECHO_CHAMBER,
        rewiring_prob: float = 0.15,
        clustering_coeff: float = 0.6,
        seed: int = 42,
    ) -> None:
        self.num_agents = num_agents
        self.network_type = network_type
        self.rewiring_prob = rewiring_prob
        self.clustering_coeff = clustering_coeff
        self.seed = seed
        self.adj: Dict[str, Set[str]] = {f"agent_{i}": set() for i in range(num_agents)}
        self._build_graph()

    def _add_edge(self, u: str, v: str) -> None:
        if u != v:
            self.adj[u].add(v)
            self.adj[v].add(u)

    def _build_graph(self) -> None:
        random.seed(self.seed)
        n = self.num_agents

        if self.network_type == NetworkType.ECHO_CHAMBER:
            half = n // 2
            # Cluster 1
            for i in range(half):
                for j in range(i + 1, half):
                    if random.random() < 0.45:
                        self._add_edge(f"agent_{i}", f"agent_{j}")
            # Cluster 2
            for i in range(half, n):
                for j in range(i + 1, n):
                    if random.random() < 0.45:
                        self._add_edge(f"agent_{i}", f"agent_{j}")
            # Cross bridges
            num_bridges = max(1, int(n * 0.08))
            for _ in range(num_bridges):
                u = f"agent_{random.randint(0, half - 1)}"
                v = f"agent_{random.randint(half, n - 1)}"
                self._add_edge(u, v)

        elif self.network_type == NetworkType.SMALL_WORLD:
            k = max(2, min(4, n - 1))
            for i in range(n):
                for j in range(1, (k // 2) + 1):
                    neighbor = (i + j) % n
                    if random.random() < self.rewiring_prob:
                        target = random.randint(0, n - 1)
                        self._add_edge(f"agent_{i}", f"agent_{target}")
                    else:
                        self._add_edge(f"agent_{i}", f"agent_{neighbor}")

        elif self.network_type == NetworkType.SCALE_FREE:
            # Barabási-Albert preferential attachment
            m = max(1, min(2, n - 1))
            degrees: List[str] = []
            for i in range(min(3, n)):
                for j in range(i + 1, min(3, n)):
                    self._add_edge(f"agent_{i}", f"agent_{j}")
                    degrees.extend([f"agent_{i}", f"agent_{j}"])
            
            for i in range(3, n):
                new_node = f"agent_{i}"
                targets = set()
                while len(targets) < min(m, len(degrees)):
                    chosen = random.choice(degrees)
                    targets.add(chosen)
                for t in targets:
                    self._add_edge(new_node, t)
                    degrees.extend([new_node, t])
        else:
            # Erdős-Rényi
            p = max(0.15, 3.0 / n)
            for i in range(n):
                for j in range(i + 1, n):
                    if random.random() < p:
                        self._add_edge(f"agent_{i}", f"agent_{j}")

        # Ensure minimal connectedness
        for i in range(n):
            node = f"agent_{i}"
            if len(self.adj[node]) == 0:
                peer = f"agent_{(i + 1) % n}"
                self._add_edge(node, peer)

    def get_neighbors(self, agent_id: str) -> List[str]:
        return list(self.adj.get(agent_id, []))

    def get_degree_centrality(self) -> Dict[str, float]:
        n = max(1, self.num_agents - 1)
        return {node: len(neighbors) / n for node, neighbors in self.adj.items()}

    def get_graph_metrics(self) -> Dict[str, Any]:
        total_edges = sum(len(neighbors) for neighbors in self.adj.values()) // 2
        return {
            "num_nodes": self.num_agents,
            "num_edges": total_edges,
            "average_degree": round(2 * total_edges / max(1, self.num_agents), 3),
            "network_type": self.network_type.value,
        }

    def to_adjacency_data(self) -> Dict[str, Any]:
        nodes = [{"id": node, "degree": len(neighbors)} for node, neighbors in self.adj.items()]
        links = []
        seen = set()
        for u, neighbors in self.adj.items():
            for v in neighbors:
                key = tuple(sorted([u, v]))
                if key not in seen:
                    seen.add(key)
                    links.append({"source": u, "target": v})
        return {"nodes": nodes, "links": links}
