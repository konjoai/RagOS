import { motion, AnimatePresence } from "motion/react";
import { ease } from "@konjoai/ui";
import type { SourceChunk } from "../lib/types";

export interface SourcesListProps {
  sources: SourceChunk[];
  /** Optional CRAG classification per source — same indices as `sources`. */
  cragClassification?: string[] | null;
  cragScores?: number[] | null;
  selected?: string | null;
  onSelect: (source: SourceChunk, index: number) => void;
  /** Cinematic reveal when populated after a scan. */
  cinematic?: boolean;
}

const CRAG_COLOR: Record<string, string> = {
  correct:    "var(--color-konjo-good)",
  ambiguous:  "var(--color-konjo-warm)",
  incorrect:  "var(--color-konjo-hot)",
};

/**
 * The retrieved sources as severity-tinted cards. Click any card to open
 * the ChunkInspector.
 */
export function SourcesList({
  sources, cragClassification, cragScores, selected, onSelect, cinematic = false,
}: SourcesListProps) {
  if (sources.length === 0) {
    return (
      <div className="glass-konjo rounded-konjo p-6 text-center">
        <div className="text-konjo-fg-muted text-konjo-mono text-[12px]">
          no sources yet — run a query.
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {sources.map((s, i) => {
          const cls = cragClassification?.[i];
          const c = cls ? CRAG_COLOR[cls] : "var(--color-konjo-accent)";
          const cragScore = cragScores?.[i];
          const isActive = selected != null && selected === `${s.source}#${i}`;
          return (
            <motion.li
              key={`${s.source}-${i}`}
              layout
              initial={cinematic ? { opacity: 0, y: 8, filter: "blur(4px)" } : false}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.4,
                ease: ease.kanjo,
                delay: cinematic ? Math.min(i * 0.05, 0.5) : 0,
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(s, i)}
                aria-pressed={isActive}
                className={[
                  "w-full text-left rounded-konjo p-3 border transition-colors",
                  isActive
                    ? "border-konjo-accent bg-konjo-surface-2/70"
                    : "border-konjo-line bg-konjo-surface/60 hover:bg-konjo-surface-2/50",
                ].join(" ")}
                style={{ borderLeft: `2px solid ${c}` }}
              >
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span
                    className="text-konjo-mono uppercase tracking-[0.16em] text-[10px] tabular-nums"
                    style={{ minWidth: 20, color: "var(--color-konjo-fg-muted)" }}
                  >
                    #{i + 1}
                  </span>
                  <span className="text-konjo-mono text-[12px] text-konjo-fg flex-1 truncate">
                    {s.source}
                  </span>
                  <span
                    className="text-konjo-mono text-[11px] tabular-nums shrink-0"
                    style={{ color: c }}
                    title="reranker score"
                  >
                    {s.score.toFixed(3)}
                  </span>
                  {cragScore != null && (
                    <span
                      className="text-konjo-mono text-[10px] tabular-nums shrink-0"
                      title="CRAG score"
                      style={{ color: c, opacity: 0.75 }}
                    >
                      ({(cragScore * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
                <p
                  className="text-konjo-fg-muted"
                  style={{ fontSize: 12.5, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {s.content_preview}
                </p>
                {cls && (
                  <div className="mt-1.5">
                    <span
                      className="text-konjo-mono uppercase tracking-[0.16em] text-[9px]"
                      style={{ color: c }}
                    >
                      crag · {cls}
                    </span>
                  </div>
                )}
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
