import { motion, AnimatePresence } from "motion/react";
import { ease } from "@konjoai/ui";
import type { QueryResponse, SourceChunk } from "../lib/types";

export interface ChunkInspectorProps {
  open: boolean;
  source: SourceChunk | null;
  index: number | null;
  trace: QueryResponse | null;
  onClose: () => void;
}

/**
 * Drawer revealing every available score for a source — reranker logit
 * (real), CRAG class + score (real if CRAG enabled), Self-RAG ISREL/ISSUP/ISUSE
 * (real per-iteration if Self-RAG enabled), and the full content preview.
 *
 * Honesty note: kyro's /query response does NOT separately expose pre-rerank
 * dense / BM25 scores; we surface only what the API gives us today.
 */
export function ChunkInspector({ open, source, index, trace, onClose }: ChunkInspectorProps) {
  return (
    <AnimatePresence>
      {open && source && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-konjo-bg/80"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: ease.kanjo }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] glass-konjo border-l border-konjo-line overflow-y-auto"
          >
            <Header source={source} index={index} onClose={onClose} />
            <Body source={source} index={index} trace={trace} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Header({ source, index, onClose }: { source: SourceChunk; index: number | null; onClose: () => void }) {
  return (
    <header className="sticky top-0 backdrop-blur-md bg-konjo-bg/85 border-b border-konjo-line/60 px-5 py-4 flex items-baseline gap-3">
      <div className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] text-konjo-fg-muted">
        chunk
      </div>
      <div className="text-konjo-display text-konjo-fg" style={{ fontSize: 16, fontWeight: 600 }}>
        #{(index ?? 0) + 1} · {source.source}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="close"
        className="ml-auto text-konjo-fg-muted hover:text-konjo-fg text-konjo-mono text-[12px]"
      >
        ✕
      </button>
    </header>
  );
}

function Body({ source, index, trace }: { source: SourceChunk; index: number | null; trace: QueryResponse | null }) {
  const i = index ?? 0;
  const cragScore = trace?.crag_scores?.[i];
  const cragClass = trace?.crag_classification?.[i];

  return (
    <div className="px-5 py-4 space-y-5">
      {/* Score block */}
      <section>
        <div className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] text-konjo-fg-muted mb-2">
          scores
        </div>
        <div className="space-y-2">
          <ScoreBar label="reranker"  value={source.score} max={1} accent="var(--color-konjo-accent)" detail="cross-encoder logit" />
          {cragScore != null && (
            <ScoreBar label={`CRAG · ${cragClass ?? "—"}`} value={cragScore} max={1} accent={cragClassColor(cragClass)} detail="confidence" />
          )}
        </div>
        <p className="text-konjo-fg-faint text-konjo-mono text-[10px] mt-2">
          dense + BM25 raw scores aren't exposed by /query today — only the RRF-fused reranker output is.
        </p>
      </section>

      {/* Self-RAG iteration scores (per-trace, not per-chunk) */}
      {trace?.self_rag_iteration_scores && trace.self_rag_iteration_scores.length > 0 && (
        <section>
          <div className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] text-konjo-fg-muted mb-2">
            self-rag · iteration scores (whole-trace)
          </div>
          <div className="space-y-1.5">
            {trace.self_rag_iteration_scores.map((it, idx) => (
              <div key={idx} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center">
                <span className="text-konjo-mono text-[10px] tabular-nums text-konjo-fg-muted">it{idx + 1}</span>
                <Mini label="ISREL" value={it.ISREL} accent="var(--color-konjo-cool)" />
                <Mini label="ISSUP" value={it.ISSUP} accent="var(--color-konjo-violet)" />
                <Mini label="ISUSE" value={it.ISUSE} accent="var(--color-konjo-good)" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content preview */}
      <section>
        <div className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] text-konjo-fg-muted mb-2">
          content preview
        </div>
        <pre
          className="text-konjo-fg whitespace-pre-wrap rounded-konjo bg-konjo-surface/60 border border-konjo-line/60 p-3"
          style={{ fontFamily: "var(--font-konjo-mono)", fontSize: 12.5, lineHeight: 1.55, maxHeight: 260, overflow: "auto" }}
        >
{source.content_preview}
        </pre>
      </section>
    </div>
  );
}

function ScoreBar({ label, value, max, accent, detail }: { label: string; value: number; max: number; accent: string; detail?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-konjo-mono text-[11px]">
        <span className="uppercase tracking-[0.16em] text-konjo-fg-muted">{label}</span>
        <span className="tabular-nums" style={{ color: accent }}>{value.toFixed(3)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-konjo-line/60 overflow-hidden mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 6px ${accent}` }} />
      </div>
      {detail && <div className="text-konjo-mono text-[9px] text-konjo-fg-faint mt-0.5">{detail}</div>}
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-konjo-mono text-[9px] uppercase tracking-[0.16em] text-konjo-fg-muted">{label}</span>
      <span className="text-konjo-mono text-[11px] tabular-nums" style={{ color: accent }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function cragClassColor(cls: string | undefined): string {
  if (cls === "correct")   return "var(--color-konjo-good)";
  if (cls === "ambiguous") return "var(--color-konjo-warm)";
  if (cls === "incorrect") return "var(--color-konjo-hot)";
  return "var(--color-konjo-fg-muted)";
}
