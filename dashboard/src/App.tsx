import { useEffect, useRef, useState } from "react";
import { KonjoApp } from "@konjoai/ui";
import { PipelineFlow } from "./views/PipelineFlow";
import { AnswerStream } from "./views/AnswerStream";
import { SourcesList } from "./views/SourcesList";
import { ChunkInspector } from "./views/ChunkInspector";
import { AgentReasoning } from "./views/AgentReasoning";
import { AuditTimeline } from "./views/AuditTimeline";
import { QueryBar } from "./views/QueryBar";
import type { FeatureFlags } from "./views/QueryBar";
import { EvalCard } from "./views/EvalCard";
import { MetaInspector } from "./views/MetaInspector";
import {
  fetchHealth, querySync, queryStream, agentStream, fetchAuditEvents,
} from "./lib/api";
import { MOCK_RAGAS } from "./lib/mock";
import type {
  AgentStep,
  AuditEventsResponse,
  HealthResponse,
  Mode,
  QueryResponse,
  SourceChunk,
  StreamState,
} from "./lib/types";

const DEFAULT_FLAGS: FeatureFlags = {
  hyde: true, crag: true, selfRag: false, decomposition: false, graphRag: false,
};

const STAGE_VISUAL_MS = 380; // per-stage cursor advance during streaming
const STAGE_COUNT = 8;

export default function App() {
  const [question, setQuestion] = useState<string>("How long does a refund take to process?");
  const [mode, setMode] = useState<Mode>("query");
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<SourceChunk[]>([]);
  const [trace, setTrace] = useState<QueryResponse | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentAnswer, setAgentAnswer] = useState<string>("");
  const [pipelineCursor, setPipelineCursor] = useState<number>(0);
  const [queryFromMock, setQueryFromMock] = useState<boolean>(false);
  const [agentFromMock, setAgentFromMock] = useState<boolean>(false);

  const [health, setHealth] = useState<HealthResponse>({ status: "ok", vector_count: 0, bm25_built: false });
  const [healthFromMock, setHealthFromMock] = useState<boolean>(true);
  const [audit, setAudit] = useState<AuditEventsResponse | null>(null);
  const [auditFromMock, setAuditFromMock] = useState<boolean>(true);

  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [inspectorIndex, setInspectorIndex] = useState<number | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);

  // Pull /health and /audit/events every 8s.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const [h, a] = await Promise.all([fetchHealth(), fetchAuditEvents(20)]);
      if (cancelled) return;
      setHealth(h.data);
      setHealthFromMock(h.fromMock);
      setAudit(a.data);
      setAuditFromMock(a.fromMock);
    };
    void refresh();
    const id = setInterval(refresh, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Drive the pipeline cursor while streaming so stages walk forward.
  useEffect(() => {
    if (streamState !== "streaming") return;
    setPipelineCursor(0);
    const id = setInterval(() => {
      setPipelineCursor((c) => Math.min(c + 1, STAGE_COUNT - 1));
    }, STAGE_VISUAL_MS);
    return () => clearInterval(id);
  }, [streamState]);

  const ask = async () => {
    cancelRef.current?.();
    if (question.trim().length === 0) return;
    setStreamState("streaming");
    setAnswer("");
    setSources([]);
    setTrace(null);
    setAgentSteps([]);
    setAgentAnswer("");

    if (mode === "query") {
      // Two paths: stream the answer text via /query/stream, then fetch
      // the full /query response in parallel for telemetry + sources +
      // CRAG/Self-RAG metadata.
      const handle = queryStream(
        { question, top_k: 5, use_hyde: flags.hyde, use_crag: flags.crag, use_self_rag: flags.selfRag, use_decomposition: flags.decomposition, use_graph_rag: flags.graphRag },
        (e, opts) => {
          setQueryFromMock(opts.fromMock);
          if (e.kind === "token") setAnswer((a) => a + e.text);
          else if (e.kind === "final") setSources(e.sources);
        },
      );
      cancelRef.current = handle.cancel;

      const tracePromise = querySync({
        question, top_k: 5,
        use_hyde: flags.hyde, use_crag: flags.crag, use_self_rag: flags.selfRag,
        use_decomposition: flags.decomposition, use_graph_rag: flags.graphRag,
      });

      const [, { data: tr, fromMock: traceMock }] = await Promise.all([handle.done, tracePromise]);
      setTrace(tr);
      // /query is the source of truth for sources + CRAG metadata; replace
      // the streaming-final sources with the richer payload.
      setSources(tr.sources);
      if (traceMock) setQueryFromMock(true);
      setStreamState("done");
    } else {
      const handle = agentStream(
        { question, top_k: 5, max_steps: 5 },
        (e, opts) => {
          setAgentFromMock(opts.fromMock);
          if (e.kind === "step") setAgentSteps((s) => [...s, e.step]);
          else if (e.kind === "result") {
            setAgentAnswer(e.answer);
            setSources(e.sources);
          }
        },
      );
      cancelRef.current = handle.cancel;
      const res = await handle.done;
      setAgentAnswer(res.answer);
      setSources(res.sources);
      if (res.fromMock) setAgentFromMock(true);
      setStreamState("done");
    }
  };

  // Auto-run on mount.
  useEffect(() => {
    void ask();
    return () => cancelRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = streamState === "streaming";

  return (
    <KonjoApp
      product="kyro"
      tagline="RAG Observatory · every retrieval, dissected"
      status={
        live ? { label: "streaming", severity: "info" } :
        streamState === "done"
          ? { label: (mode === "agent" ? agentFromMock : queryFromMock) ? "offline · mocks" : "live", severity: (mode === "agent" ? agentFromMock : queryFromMock) ? "warn" : "ok" }
          : { label: "idle", severity: "info" }
      }
    >
      <Hero />

      <div className="space-y-6 mt-10">
        <QueryBar
          question={question}
          onQuestionChange={setQuestion}
          mode={mode}
          onModeChange={(m) => { setMode(m); }}
          flags={flags}
          onFlagsChange={setFlags}
          onSubmit={ask}
          disabled={live}
          submitLabel={live ? (mode === "agent" ? "deliberating…" : "streaming…") : (streamState === "done" ? "re-ask" : "ask")}
        />

        {mode === "query" && (
          <PipelineFlow state={streamState} trace={trace} flags={flags} cursor={pipelineCursor} />
        )}

        <section className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
          {mode === "query"
            ? <AnswerStream
                text={answer}
                state={streamState}
                intent={trace?.intent ?? null}
                cacheHit={trace?.cache_hit ?? null}
                model={trace?.model}
                promptEcho={question}
              />
            : <AgentReasoning
                steps={agentSteps}
                streaming={live}
                state={streamState}
                answer={streamState === "done" ? agentAnswer : undefined}
              />}

          <div className="space-y-3">
            <h3 className="text-konjo-display text-konjo-fg" style={{ fontSize: 16, fontWeight: 600 }}>
              Sources
              <span className="text-konjo-mono text-[11px] text-konjo-fg-muted ml-2">{sources.length}</span>
            </h3>
            <SourcesList
              sources={sources}
              cragClassification={trace?.crag_classification}
              cragScores={trace?.crag_scores}
              selected={inspectorIndex != null && sources[inspectorIndex]
                ? `${sources[inspectorIndex].source}#${inspectorIndex}`
                : null}
              onSelect={(_, i) => { setInspectorIndex(i); setInspectorOpen(true); }}
              cinematic={streamState === "done"}
            />
          </div>
        </section>

        <AuditTimeline events={audit} fromMock={auditFromMock} />

        <EvalCard scores={MOCK_RAGAS} />

        <MetaInspector
          health={health}
          mode={mode}
          healthFromMock={healthFromMock}
          queryFromMock={queryFromMock}
          agentFromMock={agentFromMock}
          auditFromMock={auditFromMock}
        />

        <Footer />
      </div>

      <ChunkInspector
        open={inspectorOpen}
        source={inspectorIndex != null ? sources[inspectorIndex] ?? null : null}
        index={inspectorIndex}
        trace={trace}
        onClose={() => setInspectorOpen(false)}
      />
    </KonjoApp>
  );
}

function Hero() {
  return (
    <section className="text-center pt-6 pb-2">
      <p className="text-konjo-mono uppercase tracking-[0.32em] text-konjo-violet" style={{ fontSize: 11 }}>
        kyro · 距離 · distance · 距 · gap
      </p>
      <h1
        className="text-konjo-display text-konjo-fg mt-4 mx-auto"
        style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.025em", maxWidth: 920, lineHeight: 1.05 }}
      >
        Every retrieval, <span style={{ color: "var(--color-konjo-accent)" }}>dissected</span>.
      </h1>
      <p
        className="text-konjo-fg-muted mt-5 mx-auto"
        style={{ fontSize: 16, maxWidth: 640, lineHeight: 1.55 }}
      >
        Watch a RAG pipeline think. Stages walk left to right. Sources score themselves. Click any chunk to see why it ranked. Switch to agent mode and the ReAct loop streams its thoughts live.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="mt-16 pt-8 border-t border-konjo-line/60 text-konjo-fg-muted text-konjo-mono"
      style={{ fontSize: 12 }}
    >
      <div className="flex flex-wrap gap-4 justify-between items-baseline">
        <span>
          built on{" "}
          <span className="text-konjo-fg">@konjoai/ui</span>
          {" · "}
          <span className="text-konjo-fg">/query</span>
          {" · "}
          <span className="text-konjo-fg">/query/stream</span>
          {" · "}
          <span className="text-konjo-fg">/agent/query/stream</span>
          {" · "}
          <span className="text-konjo-fg">/audit/events</span>
        </span>
        <span className="text-konjo-fg-faint">
          part of the KonjoAI portfolio · vectro · squish · miru · kohaku · kairu · toki · squash
        </span>
      </div>
    </footer>
  );
}
