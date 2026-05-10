import { useMemo } from "react";
import { motion } from "motion/react";
import { ease } from "@konjoai/ui";
import type { AuditEvent, AuditEventsResponse } from "../lib/types";

export interface AuditTimelineProps {
  events: AuditEventsResponse | null;
  fromMock: boolean;
}

const EVENT_COLOR: Record<string, string> = {
  query:         "var(--color-konjo-accent)",
  agent_query:   "var(--color-konjo-violet)",
  ingest:        "var(--color-konjo-good)",
  rate_limited:  "var(--color-konjo-warm)",
  auth_failure:  "var(--color-konjo-hot)",
};

/**
 * Audit timeline. Bars positioned along a horizontal time axis; click to
 * inspect (visual only — no PII anywhere; only question_hash is shown).
 */
export function AuditTimeline({ events, fromMock }: AuditTimelineProps) {
  const data = events?.events ?? [];

  const range = useMemo(() => {
    if (data.length === 0) return null;
    const ts = data.map((e) => new Date(e.timestamp).getTime()).sort((a, b) => a - b);
    return { min: ts[0], max: ts[ts.length - 1] };
  }, [data]);

  if (!events || data.length === 0) {
    return (
      <section className="space-y-3">
        <Header fromMock={fromMock} count={0} />
        <div className="glass-konjo rounded-konjo-lg p-6 text-center text-konjo-fg-muted text-konjo-mono text-[12px]">
          {events?.audit_enabled === false ? "audit logging disabled on server" : "no audit events"}
        </div>
      </section>
    );
  }

  const span = range ? Math.max(1, range.max - range.min) : 1;
  const xfor = (ts: string) => {
    if (!range) return 0;
    const t = new Date(ts).getTime();
    return ((t - range.min) / span) * 100;
  };

  // Aggregate counts per event_type for the legend.
  const counts: Record<string, number> = {};
  for (const e of data) counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;

  return (
    <section className="space-y-3">
      <Header fromMock={fromMock} count={data.length} />
      <div className="glass-konjo rounded-konjo-lg p-5">
        <div className="relative h-20">
          {/* Axis */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-konjo-line" />

          {/* Events */}
          {data.map((e, i) => {
            const x = xfor(e.timestamp);
            const c = EVENT_COLOR[e.event_type] ?? "var(--color-konjo-fg-muted)";
            // Latency drives the bar height (cap at 1s for sanity).
            const heightPct = Math.min(100, Math.max(8, (e.latency_ms / 1000) * 100));
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: ease.kanjo, delay: i * 0.03 }}
                className="absolute origin-bottom"
                style={{
                  left: `${x}%`,
                  bottom: "50%",
                  transform: "translateX(-50%)",
                  width: 4,
                  height: `${heightPct}%`,
                  background: c,
                  boxShadow: `0 0 6px ${c}`,
                  borderRadius: 1,
                }}
                title={`${e.event_type} · ${e.latency_ms.toFixed(0)}ms · ${e.timestamp}${e.tenant_id ? " · " + e.tenant_id : ""}`}
              />
            );
          })}
        </div>

        {/* Time labels */}
        {range && (
          <div className="flex justify-between text-konjo-mono text-[10px] text-konjo-fg-muted mt-2">
            <span>{fmtTime(new Date(range.min))}</span>
            <span>{fmtTime(new Date(range.max))}</span>
          </div>
        )}

        {/* Recent events list */}
        <ul className="mt-4 divide-y divide-konjo-line/50 max-h-56 overflow-y-auto">
          {data.slice(0, 12).map((e, i) => (
            <RecentRow key={i} event={e} />
          ))}
        </ul>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3 text-konjo-mono text-[10px] text-konjo-fg-muted">
          {(["query", "agent_query", "ingest", "rate_limited", "auth_failure"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: EVENT_COLOR[k], boxShadow: `0 0 5px ${EVENT_COLOR[k]}` }} />
              <span>{k}</span>
              <span className="text-konjo-fg tabular-nums">{counts[k] ?? 0}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header({ fromMock, count }: { fromMock: boolean; count: number }) {
  return (
    <header className="flex items-baseline justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-konjo-display text-konjo-fg" style={{ fontSize: 20, fontWeight: 600 }}>
          Audit timeline
        </h2>
        <p className="text-konjo-fg-muted text-[13px] mt-1">
          OWASP-compliant — only <code className="text-konjo-mono">question_hash</code>, never the question
        </p>
      </div>
      <span className="text-konjo-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: fromMock ? "var(--color-konjo-warm)" : "var(--color-konjo-good)" }}>
        {fromMock ? "offline · mock" : `live · ${count}`}
      </span>
    </header>
  );
}

function RecentRow({ event }: { event: AuditEvent }) {
  const c = EVENT_COLOR[event.event_type] ?? "var(--color-konjo-fg-muted)";
  const status = event.status_code >= 400 ? "var(--color-konjo-hot)" : "var(--color-konjo-good)";
  return (
    <li className="py-1.5 flex items-baseline gap-3">
      <span className="inline-block rounded-full shrink-0" style={{ width: 6, height: 6, background: c, boxShadow: `0 0 5px ${c}` }} />
      <span className="text-konjo-mono text-[11px] text-konjo-fg-muted shrink-0" style={{ minWidth: 80 }}>
        {fmtTime(new Date(event.timestamp))}
      </span>
      <span className="text-konjo-mono text-[11px] text-konjo-fg shrink-0" style={{ minWidth: 90, color: c }}>
        {event.event_type}
      </span>
      <span className="text-konjo-mono text-[11px] text-konjo-fg-muted truncate flex-1 min-w-0">
        {event.endpoint}
        {event.tenant_id && <span className="text-konjo-fg-faint"> · {event.tenant_id}</span>}
        {event.question_hash && <span className="text-konjo-fg-faint"> · {event.question_hash.slice(0, 8)}</span>}
      </span>
      <span className="text-konjo-mono text-[11px] tabular-nums shrink-0" style={{ color: status }}>
        {event.status_code}
      </span>
      <span className="text-konjo-mono text-[11px] tabular-nums shrink-0 text-konjo-fg-muted" style={{ minWidth: 56, textAlign: "right" }}>
        {event.latency_ms.toFixed(0)}ms
      </span>
    </li>
  );
}

function fmtTime(d: Date): string {
  return d.toISOString().slice(11, 19);
}
