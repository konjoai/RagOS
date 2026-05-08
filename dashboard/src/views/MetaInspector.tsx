import type { HealthResponse, Mode } from "../lib/types";

export interface MetaInspectorProps {
  health: HealthResponse;
  mode: Mode;
  healthFromMock: boolean;
  queryFromMock: boolean;
  agentFromMock: boolean;
  auditFromMock: boolean;
}

function StatBlock({
  label, value, accent,
}: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-konjo bg-konjo-surface/60 border border-konjo-line/60">
      <div className="text-konjo-mono uppercase tracking-[0.18em] text-[9px] text-konjo-fg-muted">{label}</div>
      <div className="text-konjo-mono tabular-nums" style={{ fontSize: 13, color: accent ?? "var(--color-konjo-fg)" }}>
        {value}
      </div>
    </div>
  );
}

const ok = "var(--color-konjo-good)";
const warn = "var(--color-konjo-warm)";

export function MetaInspector({ health, mode, healthFromMock, queryFromMock, agentFromMock, auditFromMock }: MetaInspectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatBlock label="server"  value={healthFromMock ? "offline · mock" : "live"} accent={healthFromMock ? warn : ok} />
      <StatBlock label="vectors" value={fmtCompact(health.vector_count)} />
      <StatBlock label="bm25"    value={health.bm25_built ? "built" : "missing"} accent={health.bm25_built ? ok : warn} />
      <StatBlock label="mode"    value={mode} accent={mode === "agent" ? "var(--color-konjo-violet)" : "var(--color-konjo-accent)"} />
      <StatBlock label={mode === "agent" ? "agent" : "query"} value={(mode === "agent" ? agentFromMock : queryFromMock) ? "mock replay" : "live SSE"} accent={(mode === "agent" ? agentFromMock : queryFromMock) ? warn : ok} />
      <StatBlock label="audit"   value={auditFromMock ? "mock" : "live"} accent={auditFromMock ? warn : ok} />
    </div>
  );
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
