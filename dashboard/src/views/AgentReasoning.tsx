import { motion, AnimatePresence } from "motion/react";
import { ease } from "@konjoai/ui";
import type { AgentStep, StreamState } from "../lib/types";

export interface AgentReasoningProps {
  steps: AgentStep[];
  streaming: boolean;
  state: StreamState;
  answer?: string;
}

const ACTION_COLOR: Record<string, string> = {
  retrieve: "var(--color-konjo-accent)",
  finish:   "var(--color-konjo-good)",
};

/**
 * Live agent reasoning trace. Each step renders thought / action / observation
 * as a card that fades in on arrival.
 */
export function AgentReasoning({ steps, streaming, state, answer }: AgentReasoningProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-konjo-display text-konjo-fg" style={{ fontSize: 20, fontWeight: 600 }}>
          Agent reasoning
        </h2>
        <p className="text-konjo-fg-muted text-[13px] mt-1">
          ReAct loop · streaming via <code className="text-konjo-mono">/agent/query/stream</code>
        </p>
      </header>

      <div className="glass-konjo rounded-konjo-lg p-5 space-y-3 min-h-[200px]">
        {steps.length === 0 && state === "idle" && (
          <div className="text-konjo-fg-muted text-konjo-mono text-[12px] py-8 text-center">
            switch to agent mode and ask a question to see live reasoning.
          </div>
        )}

        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </AnimatePresence>

        {streaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-konjo-fg-muted text-[12px]"
          >
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, ease: ease.seishin, repeat: Infinity }}
              className="inline-block rounded-full"
              style={{ width: 6, height: 6, background: "var(--color-konjo-accent)", boxShadow: "0 0 8px var(--color-konjo-accent)" }}
            />
            <span className="text-konjo-mono">deliberating…</span>
          </motion.div>
        )}

        <AnimatePresence>
          {answer && state === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: ease.kanjo }}
              className="border-t border-konjo-line/60 pt-3 mt-2"
            >
              <div className="text-konjo-mono uppercase tracking-[0.18em] text-konjo-violet text-[10px] mb-1">
                answer
              </div>
              <div className="text-konjo-fg" style={{ fontSize: 14, lineHeight: 1.55, fontWeight: 500 }}>
                {answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const c = ACTION_COLOR[step.action] ?? "var(--color-konjo-warm)";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: ease.kanjo }}
      className="rounded-konjo border border-konjo-line/60 bg-konjo-surface/60 p-3"
      style={{ borderLeft: `2px solid ${c}` }}
    >
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-konjo-mono tabular-nums text-[10px] text-konjo-fg-muted" style={{ minWidth: 20 }}>
          #{String(index + 1).padStart(2, "0")}
        </span>
        <span
          className="text-konjo-mono uppercase tracking-[0.18em] text-[10px]"
          style={{ color: c }}
        >
          {step.action || "—"}
        </span>
        {step.action_input && (
          <span className="text-konjo-fg-muted text-konjo-mono text-[10px] truncate" title={step.action_input}>
            ({step.action_input.slice(0, 60)}{step.action_input.length > 60 ? "…" : ""})
          </span>
        )}
      </div>
      <div className="space-y-2">
        <Field label="thought"     value={step.thought}     accent="var(--color-konjo-violet)" />
        {step.observation && step.observation !== "completed" && (
          <Field label="observation" value={step.observation} accent="var(--color-konjo-good)" mono />
        )}
      </div>
    </motion.div>
  );
}

function Field({ label, value, accent, mono = false }: { label: string; value: string; accent: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-konjo-mono uppercase tracking-[0.16em] text-[9px]" style={{ color: accent }}>
        {label}
      </div>
      <div
        className={mono ? "text-konjo-mono text-konjo-fg" : "text-konjo-fg"}
        style={{
          fontSize: mono ? 11.5 : 13,
          lineHeight: 1.5,
          marginTop: 2,
          maxHeight: mono ? 96 : undefined,
          overflow: mono ? "auto" : undefined,
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}
