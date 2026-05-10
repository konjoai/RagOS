/**
 * Mock fixtures matching kyro's response shapes. Used when /query and friends
 * are unreachable so the dashboard always has a story to tell.
 */
import type {
  QueryResponse,
  AgentResponse,
  AuditEventsResponse,
  AuditStatsResponse,
  HealthResponse,
  RagasScores,
  AgentStep,
} from "./types";

export const MOCK_HEALTH: HealthResponse = {
  status: "ok",
  vector_count: 12_487,
  bm25_built: true,
};

export const MOCK_QUERY_RESPONSE: QueryResponse = {
  answer:
    "Refunds are processed within 5–7 business days after approval. Items must be returned in original condition with proof of purchase, within 30 days. You'll get email confirmation at each step.",
  sources: [
    {
      source: "docs/policies/returns.md",
      content_preview:
        "Refund Policy\n\n30-day money-back guarantee. Return items in original packaging with proof of purchase…",
      score: 0.8945,
    },
    {
      source: "docs/faq.md",
      content_preview: "Q: How long do refunds take?\nA: Once approved, refunds are processed within 5–7 business days…",
      score: 0.7823,
    },
    {
      source: "docs/policies/shipping.md",
      content_preview: "Return shipping is paid by the customer unless the item arrived damaged…",
      score: 0.6491,
    },
    {
      source: "docs/contact.md",
      content_preview: "For refund inquiries, please email support@example.com…",
      score: 0.5108,
    },
  ],
  model: "gpt-4o-mini",
  usage: { prompt_tokens: 412, completion_tokens: 89 },
  intent: "retrieval",
  cache_hit: false,
  telemetry: {
    route: { elapsed_ms: 2.1 },
    embed: { elapsed_ms: 45.3 },
    hyde: { elapsed_ms: 88.6 },
    hybrid_search: { elapsed_ms: 18.7, top_k_dense: 20, top_k_sparse: 20 },
    crag: { elapsed_ms: 64.2, n_docs: 8 },
    rerank: { elapsed_ms: 12.4, top_k: 5 },
    generate: { elapsed_ms: 234.5, model: "gpt-4o-mini" },
  },
  crag_confidence: 0.78,
  crag_fallback: false,
  crag_scores: [0.91, 0.83, 0.71, 0.62, 0.45],
  crag_classification: ["correct", "correct", "ambiguous", "ambiguous", "incorrect"],
  crag_refinement_triggered: false,
  self_rag_support: 0.82,
  self_rag_iterations: 2,
  self_rag_iteration_scores: [
    { ISREL: 0.78, ISSUP: 0.74, ISUSE: 0.81 },
    { ISREL: 0.84, ISSUP: 0.82, ISUSE: 0.86 },
  ],
  self_rag_total_tokens: 1248,
  decomposition_used: false,
  decomposition_sub_queries: null,
  graph_rag_communities: null,
};

const AGENT_STEPS: AgentStep[] = [
  {
    thought: "The user is asking about refund processing timelines. I should retrieve relevant policy documents.",
    action: "retrieve",
    action_input: "refund processing timeline",
    observation: '[{"source": "docs/policies/returns.md", "score": 0.92, "preview": "Refund processing typically takes 5–7 business days…"}, {"source": "docs/faq.md", "score": 0.84, "preview": "How long do refunds take?…"}]',
  },
  {
    thought: "I've found policy and FAQ confirming 5–7 business days. I have enough information to answer.",
    action: "finish",
    action_input: "",
    observation: "completed",
  },
];

export const MOCK_AGENT_RESPONSE: AgentResponse = {
  answer: "The system processes refunds within 5–7 business days after approval. You'll receive email confirmation at each step.",
  sources: [
    { source: "docs/policies/returns.md", content_preview: "Refund processing typically takes 5–7 business days…", score: 0.9234 },
    { source: "docs/faq.md", content_preview: "Once approved, refunds are processed within 5–7 business days…", score: 0.8456 },
  ],
  model: "gpt-4o-mini",
  usage: { prompt_tokens: 687, completion_tokens: 67 },
  steps: AGENT_STEPS,
  telemetry: { agent: { elapsed_ms: 267.3 } },
};

export const MOCK_AGENT_STEPS = AGENT_STEPS;

export const MOCK_AUDIT_EVENTS: AuditEventsResponse = {
  events: [
    {
      event_type: "query", timestamp: "2026-05-08T07:48:30Z", endpoint: "/query",
      status_code: 200, latency_ms: 312.5, tenant_id: "acme-corp",
      client_ip: "192.168.1.100", question_hash: "a1b2c3d4e5f6g7h8",
      intent: "retrieval", cache_hit: false, result_count: 5,
    },
    {
      event_type: "query", timestamp: "2026-05-08T07:47:15Z", endpoint: "/query",
      status_code: 200, latency_ms: 89.2, tenant_id: "acme-corp",
      client_ip: "192.168.1.100", question_hash: "x9y8z7w6v5u4t3s2",
      intent: "chat", cache_hit: true, result_count: 0,
    },
    {
      event_type: "agent_query", timestamp: "2026-05-08T07:46:00Z", endpoint: "/agent/query",
      status_code: 200, latency_ms: 456.8, tenant_id: "acme-corp",
      client_ip: "192.168.1.101", question_hash: "p1q2r3s4t5u6v7w8",
      intent: "retrieval", cache_hit: false, result_count: 3,
    },
    {
      event_type: "query", timestamp: "2026-05-08T07:44:42Z", endpoint: "/query",
      status_code: 200, latency_ms: 274.1, tenant_id: "globex",
      client_ip: "10.0.0.42", question_hash: "k1l2m3n4o5p6q7r8",
      intent: "retrieval", cache_hit: false, result_count: 7,
    },
    {
      event_type: "rate_limited", timestamp: "2026-05-08T07:43:11Z", endpoint: "/query",
      status_code: 429, latency_ms: 1.2, tenant_id: "globex",
      client_ip: "10.0.0.42", question_hash: null,
      intent: null, cache_hit: null, result_count: null, reason: "rate_limited",
    },
    {
      event_type: "ingest", timestamp: "2026-05-08T07:30:00Z", endpoint: "/ingest",
      status_code: 200, latency_ms: 1843.0, tenant_id: "acme-corp",
      client_ip: "192.168.1.50", question_hash: null,
      intent: null, cache_hit: null, result_count: null,
    },
  ],
  total: 6,
  audit_enabled: true,
};

export const MOCK_AUDIT_STATS: AuditStatsResponse = {
  stats: {
    query: 1234,
    ingest: 42,
    agent_query: 89,
    auth_failure: 0,
    rate_limited: 5,
  },
  audit_enabled: true,
};

export const MOCK_RAGAS: RagasScores = {
  faithfulness: 0.87,
  answer_relevancy: 0.82,
  context_precision: 0.91,
  context_recall: 0.79,
};
