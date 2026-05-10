import { TokenStream, ease } from "@konjoai/ui";
import type { StreamToken } from "@konjoai/ui";
import { motion, AnimatePresence } from "motion/react";
import type { Intent, StreamState } from "../lib/types";

export interface AnswerStreamProps {
  text: string;
  state: StreamState;
  intent?: Intent | null;
  cacheHit?: boolean | null;
  model?: string;
  promptEcho?: string;
}

const INTENT_COLOR: Record<Intent, string> = {
  retrieval:   "var(--color-konjo-accent)",
  chat:        "var(--color-konjo-violet)",
  aggregation: "var(--color-konjo-warm)",
};

/**
 * Streaming answer pane. Tokens come in as a single growing string from
 * /query/stream; we slice into approximate words for the Konjo TokenStream.
 */
export function AnswerStream({ text, state, intent, cacheHit, model, promptEcho }: AnswerStreamProps) {
  const tokens: StreamToken[] = wordTokens(text);
  const live = state === "streaming";
  const c = intent ? INTENT_COLOR[intent] : "var(--color-konjo-fg-muted)";

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-konjo-display text-konjo-fg" style={{ fontSize: 20, fontWeight: 600 }}>
            Answer
          </h2>
          <p className="text-konjo-fg-muted text-[13px] mt-1">
            Streaming via <code className="text-konjo-mono">/query/stream</code>
            {model && <> · <span className="text-konjo-mono">{model}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AnimatePresence>
            {intent && (
              <motion.span
                key={intent}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: ease.kanjo }}
                className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] px-2 py-0.5 rounded-konjo-sm border"
                style={{ color: c, borderColor: c }}
              >
                intent · {intent}
              </motion.span>
            )}
          </AnimatePresence>
          {cacheHit != null && (
            <span
              className="text-konjo-mono uppercase tracking-[0.18em] text-[10px] px-2 py-0.5 rounded-konjo-sm border"
              style={{
                color: cacheHit ? "var(--color-konjo-good)" : "var(--color-konjo-fg-muted)",
                borderColor: cacheHit ? "var(--color-konjo-good)" : "var(--color-konjo-line)",
              }}
            >
              {cacheHit ? "cache hit" : "miss"}
            </span>
          )}
        </div>
      </header>

      {promptEcho && (
        <div className="glass-konjo rounded-konjo p-3 border-l-2" style={{ borderLeftColor: "var(--color-konjo-violet)" }}>
          <div className="text-konjo-mono uppercase tracking-[0.18em] text-[9px] text-konjo-violet mb-1">question</div>
          <div className="text-konjo-fg-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{promptEcho}</div>
        </div>
      )}

      <TokenStream tokens={tokens} cursor={live} maxHeight={300} font="display" density="loose" />
    </section>
  );
}

function wordTokens(s: string): StreamToken[] {
  if (!s) return [];
  // Split into rough word/whitespace pairs, preserving newlines.
  const out: StreamToken[] = [];
  let cur = "";
  let i = 0;
  for (const ch of s) {
    if (ch === " " || ch === "\n" || ch === "\t") {
      if (cur) { out.push({ id: i++, text: cur }); cur = ""; }
      out.push({ id: i++, text: ch });
    } else {
      cur += ch;
    }
  }
  if (cur) out.push({ id: i++, text: cur });
  return out;
}
