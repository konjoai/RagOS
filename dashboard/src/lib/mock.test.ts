import { describe, it, expect } from "vitest";
import {
  MOCK_QUERY_RESPONSE,
  MOCK_AGENT_RESPONSE,
  MOCK_AUDIT_EVENTS,
  MOCK_RAGAS,
} from "./mock";

describe("MOCK_QUERY_RESPONSE", () => {
  it("has at least 4 sources with reranker scores", () => {
    expect(MOCK_QUERY_RESPONSE.sources.length).toBeGreaterThanOrEqual(4);
    for (const s of MOCK_QUERY_RESPONSE.sources) expect(s.score).toBeGreaterThan(0);
  });
  it("CRAG arrays match sources count", () => {
    expect(MOCK_QUERY_RESPONSE.crag_scores?.length).toBe(MOCK_QUERY_RESPONSE.sources.length + 1);
    expect(MOCK_QUERY_RESPONSE.crag_classification?.length).toBe(MOCK_QUERY_RESPONSE.sources.length + 1);
  });
  it("Self-RAG iteration scores are well-formed", () => {
    for (const it of MOCK_QUERY_RESPONSE.self_rag_iteration_scores ?? []) {
      expect(it.ISREL).toBeGreaterThanOrEqual(0);
      expect(it.ISREL).toBeLessThanOrEqual(1);
      expect(it.ISSUP).toBeGreaterThanOrEqual(0);
      expect(it.ISSUP).toBeLessThanOrEqual(1);
      expect(it.ISUSE).toBeGreaterThanOrEqual(0);
      expect(it.ISUSE).toBeLessThanOrEqual(1);
    }
  });
});

describe("MOCK_AGENT_RESPONSE", () => {
  it("has a thought/action/observation per step", () => {
    for (const s of MOCK_AGENT_RESPONSE.steps) {
      expect(s.thought.length).toBeGreaterThan(0);
      expect(typeof s.action).toBe("string");
    }
  });
});

describe("MOCK_AUDIT_EVENTS", () => {
  it("never contains a raw question — only question_hash", () => {
    for (const e of MOCK_AUDIT_EVENTS.events) {
      expect((e as unknown as Record<string, unknown>).question).toBeUndefined();
      if (e.event_type === "query") expect(e.question_hash).toBeTruthy();
    }
  });
});

describe("MOCK_RAGAS", () => {
  it("scores in [0, 1]", () => {
    for (const v of Object.values(MOCK_RAGAS)) {
      if (v == null) continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
