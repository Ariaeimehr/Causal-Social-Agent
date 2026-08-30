export interface Personality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  confirmation_bias: number;
  cognitive_reflectivity: number;
}

export interface Agent {
  agent_id: string;
  name: string;
  role: string;
  personality: Personality;
  opinion: number;
  susceptibility: number;
  emotional_arousal: number;
  exposure_count: number;
  cumulative_dose: number;
  opinion_history: number[];
}

export interface NetworkNode {
  id: string;
  degree: number;
  role: string;
  susceptibility: number;
  final_opinion: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
}

export interface InteractionEvent {
  timestep: number;
  sender: string;
  sender_name: string;
  recipient: string;
  recipient_name: string;
  type: string;
  virulence?: number;
  stance?: number;
  content: string;
}

export interface SimulationTrajectoryStep {
  timestep: number;
  polarization_index: number;
  bimodality_coeff: number;
  mean_opinion: number;
  agent_opinions: Record<string, number>;
}

export interface SimulationResultData {
  config: {
    topic: string;
    numAgents: number;
    numTimesteps: number;
    networkType: string;
    misinformationInjectionStep: number;
    misinformationVirulence: number;
    misinformationTargetStance: number;
  };
  graph_data: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
  agents: Agent[];
  polarization_series: number[];
  bimodality_series: number[];
  misinformation_exposure_series: number[];
  trajectory: SimulationTrajectoryStep[];
  interaction_events: InteractionEvent[];
}

export interface CausalNode {
  id: string;
  label: string;
  type: "exogenous_trait" | "environmental" | "mediator" | "outcome";
  description?: string;
  x?: number;
  y?: number;
}

export interface CausalEdge {
  source: string;
  target: string;
  weight: number;
  p_value: number;
  causal_mechanism: string;
  path_type: string;
}

export interface StructuralEquation {
  target_variable: string;
  latex: string;
  functional_form: string;
  r_squared: number;
}

export interface HypothesisEvaluation {
  hypothesis: string;
  supported: boolean;
  estimated_ate: number;
  theoretical_justification: string;
}

export interface OracleSCMResponse {
  dag: {
    nodes: CausalNode[];
    edges: CausalEdge[];
  };
  structural_equations: StructuralEquation[];
  causal_hypotheses_evaluation: HypothesisEvaluation[];
  counterfactual_analysis: {
    intervention_query: string;
    counterfactual_outcome: string;
    policy_recommendation: string;
  };
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  topic: string;
  networkType: string;
  numAgents: number;
  numTimesteps: number;
  injectionStep: number;
  virulence: number;
  meanOpenness?: number;
  meanNeuroticism?: number;
  description: string;
}
