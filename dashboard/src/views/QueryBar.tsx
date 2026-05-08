import { useState } from "react";
import { motion } from "motion/react";
import { ease } from "@konjoai/ui";
import type { Mode } from "../lib/types";

export interface FeatureFlags {
  hyde: boolean;
  crag: boolean;
  selfRag: boolean;
  decomposition: boolean;
  graphRag: boolean;
}

export interface QueryBarProps {
  question: string;
  onQuestionChange: (s: string) => void;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  flags: FeatureFlags;
  onFlagsChange: (f: FeatureFlags) => void;
  onSubmit: () => void;
  disabled: boolean;
  submitLabel?: string;
}

const FLAG_KEYS: { id: keyof FeatureFlags; label: string }[] = [
  { id: "hyde",          label: "HyDE" },
  { id: "crag",          label: "CRAG" },
  { id: "selfRag",       label: "Self-RAG" },
  { id: "decomposition", label: "decomp" },
  { id: "graphRag",      label: "GraphRAG" },
];

export function QueryBar({
  question, onQuestionChange,
  mode, onModeChange,
  flags, onFlagsChange,
  onSubmit, disabled, submitLabel = "ask",
}: QueryBarProps) {
  const [focused, setFocused] = useState(false);
  const empty = question.trim().length === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: ease.kanjo }}
      className="space-y-3"
    >
      <div
        className={[
          "flex items-end gap-2 glass-konjo rounded-konjo p-3",
          focused ? "shadow-konjo-glow" : "",
        ].join(" ")}
      >
        <textarea
          rows={2}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !disabled && !empty) onSubmit();
          }}
          placeholder={mode === "agent" ? "ask the agent · ⌘/ctrl-enter" : "ask the corpus · ⌘/ctrl-enter"}
          className="flex-1 bg-transparent border-0 outline-none text-konjo-fg placeholder:text-konjo-fg-faint resize-none"
          style={{ fontSize: 14, lineHeight: 1.55 }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || empty}
          className={[
            "px-5 py-2 rounded-konjo text-konjo-mono uppercase tracking-[0.18em] text-[11px] transition-colors",
            disabled || empty
              ? "bg-konjo-surface text-konjo-fg-faint cursor-not-allowed"
              : "bg-konjo-accent text-konjo-bg hover:brightness-110 cursor-pointer shadow-konjo-glow",
          ].join(" ")}
        >
          {submitLabel}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <ModeToggle mode={mode} onChange={onModeChange} />
        {mode === "query" && (
          <div className="flex items-center gap-1 glass-konjo rounded-konjo p-1">
            {FLAG_KEYS.map((k) => {
              const on = flags[k.id];
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onFlagsChange({ ...flags, [k.id]: !on })}
                  aria-pressed={on}
                  className={[
                    "px-2.5 py-1 rounded-konjo-sm text-konjo-mono uppercase tracking-[0.16em] text-[10px] transition-colors",
                    on ? "bg-konjo-accent text-konjo-bg" : "text-konjo-fg-muted hover:text-konjo-fg",
                  ].join(" ")}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-konjo glass-konjo">
      {(["query", "agent"] as const).map((m) => {
        const on = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={on}
            className={[
              "px-3 py-1.5 rounded-konjo-sm text-konjo-mono uppercase tracking-[0.16em] text-[10px] transition-colors",
              on ? "bg-konjo-violet text-konjo-bg" : "text-konjo-fg-muted hover:text-konjo-fg",
            ].join(" ")}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
