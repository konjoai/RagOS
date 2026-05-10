/**
 * kyro dashboard API client.
 *
 *   - querySync           — POST /query (full RAG with telemetry)
 *   - queryStream         — POST /query/stream (cinematic answer streaming)
 *   - agentStream         — POST /agent/query/stream (cinematic ReAct streaming)
 *   - fetchAuditEvents    — GET /audit/events
 *   - fetchAuditStats     — GET /audit/stats
 *   - fetchHealth         — GET /health
 *
 * All transports transparently fall back to mocks when the server is
 * unreachable.
 */
import type {
  QueryRequest,
  QueryResponse,
  QueryStreamEvent,
  AgentRequest,
  AgentStreamEvent,
  AuditEventsResponse,
  AuditStatsResponse,
  HealthResponse,
  AgentStep,
  SourceChunk,
} from "./types";
import { parseStreamChunk } from "./sse";
import {
  MOCK_QUERY_RESPONSE,
  MOCK_AGENT_RESPONSE,
  MOCK_AGENT_STEPS,
  MOCK_AUDIT_EVENTS,
  MOCK_AUDIT_STATS,
  MOCK_HEALTH,
} from "./mock";

const BASE = (import.meta.env.VITE_KYRO_API as string | undefined) ?? "";
const TENANT = (import.meta.env.VITE_KYRO_TENANT as string | undefined) ?? "";

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (TENANT) h["x-tenant-id"] = TENANT;
  return h;
}

export async function fetchHealth(): Promise<{ data: HealthResponse; fromMock: boolean }> {
  try {
    const res = await fetch(BASE + "/health");
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = (await res.json()) as HealthResponse;
    return { data, fromMock: false };
  } catch {
    return { data: MOCK_HEALTH, fromMock: true };
  }
}

export async function querySync(req: QueryRequest): Promise<{ data: QueryResponse; fromMock: boolean }> {
  try {
    const res = await fetch(BASE + "/query", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = (await res.json()) as QueryResponse;
    return { data, fromMock: false };
  } catch {
    return { data: { ...MOCK_QUERY_RESPONSE, answer: synthFor(req.question) }, fromMock: true };
  }
}

function synthFor(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) return MOCK_QUERY_RESPONSE.answer;
  return `${MOCK_QUERY_RESPONSE.answer} (offline mock answer for: "${trimmed.slice(0, 60)}…")`;
}

export interface QueryStreamHandle {
  cancel: () => void;
  done: Promise<{ text: string; sources: SourceChunk[]; fromMock: boolean }>;
}

export function queryStream(
  req: QueryRequest,
  onEvent: (e: QueryStreamEvent, opts: { fromMock: boolean }) => void,
): QueryStreamHandle {
  const ctrl = new AbortController();
  let cancelled = false;
  let text = "";
  let sources: SourceChunk[] = [];

  const done = (async () => {
    try {
      const res = await fetch(BASE + "/query/stream", {
        method: "POST",
        headers: { ...authHeaders(), Accept: "text/event-stream" },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`http ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (!cancelled) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        const { frames, rest } = parseStreamChunk(buf);
        buf = rest;
        for (const f of frames) {
          if (f.done) continue;
          try {
            const obj = JSON.parse(f.json) as { token?: string; done?: boolean; sources?: SourceChunk[]; intent?: string; model?: string };
            if (obj.token && !obj.done) {
              text += obj.token;
              onEvent({ kind: "token", text: obj.token }, { fromMock: false });
            } else if (obj.done) {
              sources = obj.sources ?? [];
              onEvent({ kind: "final", sources, model: obj.model, intent: obj.intent as never }, { fromMock: false });
            }
          } catch {
            // ignore malformed frame
          }
        }
      }
      return { text, sources, fromMock: false };
    } catch {
      if (cancelled) return { text, sources, fromMock: true };
      // Fallback: replay mock answer token-by-token, then final sources.
      const mock = MOCK_QUERY_RESPONSE;
      const tokens = tokenize(mock.answer);
      for (const t of tokens) {
        if (cancelled) break;
        await sleep(28 + Math.random() * 18);
        text += t;
        onEvent({ kind: "token", text: t }, { fromMock: true });
      }
      onEvent({ kind: "final", sources: mock.sources, model: mock.model, intent: mock.intent }, { fromMock: true });
      return { text, sources: mock.sources, fromMock: true };
    }
  })();

  return { cancel: () => { cancelled = true; ctrl.abort(); }, done };
}

export interface AgentStreamHandle {
  cancel: () => void;
  done: Promise<{ steps: AgentStep[]; answer: string; sources: SourceChunk[]; fromMock: boolean }>;
}

export function agentStream(
  req: AgentRequest,
  onEvent: (e: AgentStreamEvent, opts: { fromMock: boolean }) => void,
): AgentStreamHandle {
  const ctrl = new AbortController();
  let cancelled = false;
  const steps: AgentStep[] = [];
  let answer = "";
  let sources: SourceChunk[] = [];

  const done = (async () => {
    try {
      const res = await fetch(BASE + "/agent/query/stream", {
        method: "POST",
        headers: { ...authHeaders(), Accept: "text/event-stream" },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`http ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (!cancelled) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        const { frames, rest } = parseStreamChunk(buf);
        buf = rest;
        for (const f of frames) {
          if (f.done) continue;
          try {
            const obj = JSON.parse(f.json);
            const t = obj.type as string;
            if (t === "step") {
              const step: AgentStep = {
                thought: obj.thought ?? "", action: obj.action ?? "",
                action_input: obj.action_input ?? "", observation: obj.observation ?? "",
              };
              steps.push(step);
              onEvent({ kind: "step", index: obj.index ?? steps.length, step }, { fromMock: false });
            } else if (t === "result") {
              answer = obj.answer ?? "";
              sources = obj.sources ?? [];
              onEvent({ kind: "result", answer, model: obj.model ?? "", sources, steps: obj.steps ?? steps }, { fromMock: false });
            } else if (t === "telemetry") {
              onEvent({ kind: "telemetry", telemetry: obj.telemetry ?? {} }, { fromMock: false });
            }
          } catch {
            // ignore malformed frame
          }
        }
      }
      return { steps, answer, sources, fromMock: false };
    } catch {
      if (cancelled) return { steps, answer, sources, fromMock: true };
      // Replay mock steps with cadence.
      for (let i = 0; i < MOCK_AGENT_STEPS.length; i++) {
        if (cancelled) break;
        await sleep(700);
        const step = MOCK_AGENT_STEPS[i];
        steps.push(step);
        onEvent({ kind: "step", index: i + 1, step }, { fromMock: true });
      }
      answer = MOCK_AGENT_RESPONSE.answer;
      sources = MOCK_AGENT_RESPONSE.sources;
      onEvent({ kind: "result", answer, model: MOCK_AGENT_RESPONSE.model, sources, steps }, { fromMock: true });
      return { steps, answer, sources, fromMock: true };
    }
  })();

  return { cancel: () => { cancelled = true; ctrl.abort(); }, done };
}

export async function fetchAuditEvents(limit = 20): Promise<{ data: AuditEventsResponse; fromMock: boolean }> {
  try {
    const res = await fetch(`${BASE}/audit/events?limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = (await res.json()) as AuditEventsResponse;
    return { data, fromMock: false };
  } catch {
    return { data: MOCK_AUDIT_EVENTS, fromMock: true };
  }
}

export async function fetchAuditStats(): Promise<{ data: AuditStatsResponse; fromMock: boolean }> {
  try {
    const res = await fetch(`${BASE}/audit/stats`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = (await res.json()) as AuditStatsResponse;
    return { data, fromMock: false };
  } catch {
    return { data: MOCK_AUDIT_STATS, fromMock: true };
  }
}

function tokenize(s: string): string[] {
  // Split into rough word-tokens preserving leading whitespace.
  const out: string[] = [];
  let cur = "";
  for (const ch of s) {
    if (ch === " " || ch === "\n") {
      if (cur) { out.push(cur); cur = ""; }
      out.push(ch);
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
