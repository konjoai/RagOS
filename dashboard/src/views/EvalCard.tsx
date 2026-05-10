import { motion } from "motion/react";
import { ease } from "@konjoai/ui";
import type { RagasScores } from "../lib/types";

export interface EvalCardProps {
  scores: RagasScores;
}

const METRICS = [
  { key: "faithfulness",     label: "Faithfulness",     accent: "var(--color-konjo-good)" },
  { key: "answer_relevancy", label: "Answer relevancy", accent: "var(--color-konjo-accent)" },
  { key: "context_precision",label: "Context precision",accent: "var(--color-konjo-violet)" },
  { key: "context_recall",   label: "Context recall",   accent: "var(--color-konjo-warm)" },
] as const;

/**
 * RAGAS scores card. Sourced from `evals/runs/<latest>/scores.json` when
 * available; falls back to a static mock so the dashboard always has a
 * story.
 */
export function EvalCard({ scores }: EvalCardProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-konjo-display text-konjo-fg" style={{ fontSize: 20, fontWeight: 600 }}>
          RAGAS quality
        </h2>
        <p className="text-konjo-fg-muted text-[13px] mt-1">
          Latest <code className="text-konjo-mono">evals/runs/</code> snapshot
        </p>
      </header>

      <div className="glass-konjo rounded-konjo-lg p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METRICS.map((m, i) => {
          const v = scores[m.key];
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: ease.kanjo, delay: i * 0.05 }}
              className="rounded-konjo bg-konjo-surface/60 border border-konjo-line/60 p-3"
            >
              <div className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] text-konjo-fg-muted">
                {m.label}
              </div>
              <div
                className="text-konjo-display tabular-nums leading-none mt-1.5"
                style={{ fontSize: 28, fontWeight: 600, color: m.accent }}
              >
                {v != null ? (v * 100).toFixed(0) : "—"}
                {v != null && <span className="text-konjo-fg-muted text-[14px] ml-1">%</span>}
              </div>
              <div className="h-1 rounded-full bg-konjo-line/60 overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(v ?? 0) * 100}%` }}
                  transition={{ duration: 0.7, ease: ease.kanjo }}
                  className="h-full rounded-full"
                  style={{ background: m.accent, boxShadow: `0 0 6px ${m.accent}` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
