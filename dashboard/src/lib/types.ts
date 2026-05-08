/**
 * TypeScript types mirroring kyro's API contract.
 * Source of truth lives in /Users/wesleyscholl/kyro/konjoai/api/schemas.py.
 */

export type Intent = "retrieval" | "chat" | "aggregation";

export interface QueryRequest {
  question: string;
  top_k?: number;
  use_hyde?: boolean;
  use_crag?: boolean;
  use_self_rag?: boolean;
  use_decomposition?: boolean;
  use_graph_rag?: boolean;
}

export interface SourceChunk {
  source: string;
  content_preview: string;
  /** Reranker cross-encoder score. */
  score: number;
}

export interface SelfRagIterationScore {
  ISREL: number; // [0, 1] retrieval relevance
  ISSUP: number; // [0, 1] support
  ISUSE: number; // [0, 1] usefulness
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
  model: string;
  usage: { prompt_tokens?: number; completion_tokens?: number };
  intent: Intent;
  cache_hit: boolean;
  telemetry: Record<string, { elapsed_ms?: number; [k: string]: unknown }> | null;

  // CRAG
  crag_confidence?: number | null;
  crag_fallback?: boolean | null;
  crag_scores?: number[] | null;
  crag_classification?: string[] | null;
  crag_refinement_triggered?: boolean | null;

  // Self-RAG
  self_rag_support?: number | null;
  self_rag_iterations?: number | null;
  self_rag_iteration_scores?: SelfRagIterationScore[] | null;
  self_rag_total_tokens?: number | null;

  // Decomposition
  decomposition_used?: boolean | null;
  decomposition_sub_queries?: string[] | null;
  decomposition_synthesis_hint?: string | null;

  // GraphRAG
  graph_rag_communities?: string[] | null;
}

/** Stream events emitted by /query/stream. */
export type QueryStreamEvent =
  | { kind: "token"; text: string }
  | { kind: "final"; sources: SourceChunk[]; model?: string; intent?: Intent }
  | { kind: "error"; error: string };

export interface AgentStep {
  thought: string;
  action: string;        // "retrieve" | "finish" | tool name
  action_input: string;
  observation: string;
}

export interface AgentRequest {
  question: string;
  top_k?: number;
  max_steps?: number;
}

export interface AgentResponse {
  answer: string;
  sources: SourceChunk[];
  model: string;
  usage: { prompt_tokens?: number; completion_tokens?: number };
  steps: AgentStep[];
  telemetry: Record<string, { elapsed_ms?: number }> | null;
}

/** Stream events emitted by /agent/query/stream. */
export type AgentStreamEvent =
  | { kind: "step"; index: number; step: AgentStep }
  | { kind: "result"; answer: string; model: string; sources: SourceChunk[]; steps: AgentStep[] }
  | { kind: "telemetry"; telemetry: Record<string, { elapsed_ms?: number }> }
  | { kind: "error"; error: string };

export interface AuditEvent {
  event_type: "query" | "ingest" | "agent_query" | "auth_failure" | "rate_limited";
  timestamp: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  tenant_id: string | null;
  client_ip: string | null;
  question_hash: string | null;
  intent: Intent | null;
  cache_hit: boolean | null;
  result_count: number | null;
  reason?: string | null;
}

export interface AuditEventsResponse {
  events: AuditEvent[];
  total: number;
  audit_enabled: boolean;
}

export interface AuditStatsResponse {
  stats: Record<string, number>;
  audit_enabled: boolean;
}

export interface HealthResponse {
  status: "ok" | string;
  vector_count: number;
  bm25_built: boolean;
}

export interface RagasScores {
  faithfulness: number | null;
  answer_relevancy: number | null;
  context_precision: number | null;
  context_recall: number | null;
}

export type StreamState = "idle" | "streaming" | "done" | "error";
export type Mode = "query" | "agent";
