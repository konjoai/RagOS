import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentReasoning } from "./AgentReasoning";
import { MOCK_AGENT_STEPS, MOCK_AGENT_RESPONSE } from "../lib/mock";

describe("AgentReasoning", () => {
  it("renders empty hint when idle and no steps", () => {
    render(<AgentReasoning steps={[]} streaming={false} state="idle" />);
    expect(screen.getByText(/switch to agent mode/i)).toBeInTheDocument();
  });

  it("renders thoughts and actions for each step", () => {
    render(<AgentReasoning steps={MOCK_AGENT_STEPS} streaming={false} state="done" />);
    for (const s of MOCK_AGENT_STEPS) expect(screen.getByText(s.thought)).toBeInTheDocument();
  });

  it("shows the deliberating indicator when streaming", () => {
    render(<AgentReasoning steps={MOCK_AGENT_STEPS.slice(0, 1)} streaming={true} state="streaming" />);
    expect(screen.getByText(/deliberating/i)).toBeInTheDocument();
  });

  it("renders the answer block when complete", () => {
    render(<AgentReasoning steps={MOCK_AGENT_STEPS} streaming={false} state="done" answer={MOCK_AGENT_RESPONSE.answer} />);
    expect(screen.getByText(MOCK_AGENT_RESPONSE.answer)).toBeInTheDocument();
  });
});
