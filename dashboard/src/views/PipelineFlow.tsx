import { StagePipeline } from "@konjoai/ui";
import type { Stage, StageStatus } from "@konjoai/ui";
import type { QueryResponse, StreamState } from "../lib/types";

export interface PipelineFlowProps {
  state: StreamState;
  /** Trace returned by /query (telemetry has per-stage elapsed_ms). */
  trace?: QueryResponse | null;
  /** Feature flags so we can mark stages as skipped when disabled. */
  flags: { hyde: boolean; crag: boolean; selfRag: boolean; decomposition: boolean; graphRag: boolean };
  /** Animated cursor position when streaming (0..stages.length-1). */
  cursor?: number;
}

const STAGE_KEYS: { id: string; label: string; telemetryKey: string; flagKey?: keyof PipelineFlowProps["flags"]; alwaysOn?: boolean }[] = [
  { id: "route",  label: "Intent",  telemetryKey: "route", alwaysOn: true },
  { id: "hyde",   label: "HyDE",    telemetryKey: "hyde",  flagKey: "hyde" },
  { id: "embed",  label: "Embed",   telemetryKey: "embed", alwaysOn: true },
  { id: "hybrid", label: "Hybrid",  telemetryKey: "hybrid_search", alwaysOn: true },
  { id: "crag",   label: "CRAG",    telemetryKey: "crag",  flagKey: "crag" },
  { id: "rerank", label: "Rerank",  telemetryKey: "rerank", alwaysOn: true },
  { id: "self",   label: "Self-RAG",telemetryKey: "self_rag", flagKey: "selfRag" },
  { id: "gen",    label: "Generate",telemetryKey: "generate", alwaysOn: true },
];

/**
 * Stage-by-stage RAG pipeline. Real elapsed_ms from /query telemetry.
 * Disabled features (HyDE off, CRAG off, etc.) render as muted "skipped".
 */
export function PipelineFlow({ state, trace, flags, cursor }: PipelineFlowProps) {
  const stages: Stage[] = STAGE_KEYS.map((s, i) => {
    const enabled = s.alwaysOn || (s.flagKey ? flags[s.flagKey] : true);
    let status: StageStatus = "pending";
    if (state === "idle") status = "pending";
    else if (!enabled) status = "pending";
    else if (state === "done") status = "done";
    else if (state === "streaming") {
      // visual cadence
      if (cursor != null) {
        status = i < cursor ? "done" : i === cursor ? "active" : "pending";
      } else {
        status = i === 0 ? "active" : "pending";
      }
    } else if (state === "error") {
      status = i === 0 ? "error" : "pending";
    }

    let detail: string | undefined;
    let durationMs: number | undefined;
    if (trace?.telemetry) {
      const t = trace.telemetry[s.telemetryKey] as { elapsed_ms?: number; [k: string]: unknown } | undefined;
      if (t && t.elapsed_ms != null) {
        durationMs = t.elapsed_ms;
        detail = describeStage(s.telemetryKey, t, trace);
      }
    }

    if (!enabled) {
      detail = "skipped";
      durationMs = undefined;
    }

    return { id: s.id, label: s.label, status, durationMs, detail };
  });

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-konjo-display text-konjo-fg" style={{ fontSize: 20, fontWeight: 600 }}>
          Pipeline
        </h2>
        <p className="text-konjo-fg-muted text-[13px] mt-1">
          Eight stages · real <code className="text-konjo-mono">elapsed_ms</code> from <code className="text-konjo-mono">telemetry</code>
        </p>
      </header>
      <div className="glass-konjo rounded-konjo-lg p-5 overflow-x-auto">
        <StagePipeline stages={stages} />
      </div>
    </section>
  );
}

function describeStage(
  key: string,
  t: { elapsed_ms?: number; [k: string]: unknown },
  trace: QueryResponse,
): string | undefined {
  if (key === "hybrid_search") {
    const dense = t.top_k_dense ?? "?";
    const sparse = t.top_k_sparse ?? "?";
    return `dense ${dense} · BM25 ${sparse} · RRF`;
  }
  if (key === "rerank") {
    const top = t.top_k ?? trace.sources.length;
    return `cross-encoder · top ${top}`;
  }
  if (key === "crag") {
    const n = t.n_docs ?? "?";
    const conf = trace.crag_confidence;
    const c = conf != null ? ` · conf ${(conf * 100).toFixed(0)}%` : "";
    return `${n} docs${c}`;
  }
  if (key === "generate") {
    return `${trace.model}`;
  }
  if (key === "self_rag") {
    const its = trace.self_rag_iterations;
    return its ? `${its} iter${its === 1 ? "" : "s"}` : undefined;
  }
  return undefined;
}
