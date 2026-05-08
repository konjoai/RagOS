import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryBar } from "./QueryBar";
import type { FeatureFlags } from "./QueryBar";

const FLAGS: FeatureFlags = { hyde: true, crag: true, selfRag: false, decomposition: false, graphRag: false };

const noop = () => {};

describe("QueryBar", () => {
  it("renders the textarea + ask button", () => {
    render(<QueryBar question="" onQuestionChange={noop} mode="query" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    expect(screen.getByPlaceholderText(/ask the corpus/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask/i })).toBeInTheDocument();
  });

  it("disables submit when empty", () => {
    render(<QueryBar question="" onQuestionChange={noop} mode="query" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    expect(screen.getByRole("button", { name: /ask/i })).toBeDisabled();
  });

  it("enables submit when non-empty", () => {
    render(<QueryBar question="hi" onQuestionChange={noop} mode="query" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    expect(screen.getByRole("button", { name: /ask/i })).toBeEnabled();
  });

  it("calls onSubmit when the button is clicked", async () => {
    const onSubmit = vi.fn();
    render(<QueryBar question="hi" onQuestionChange={noop} mode="query" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={onSubmit} disabled={false} />);
    await userEvent.click(screen.getByRole("button", { name: /ask/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("toggles between query and agent modes", async () => {
    const onModeChange = vi.fn();
    render(<QueryBar question="" onQuestionChange={noop} mode="query" onModeChange={onModeChange} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    await userEvent.click(screen.getByRole("button", { name: /agent/i }));
    expect(onModeChange).toHaveBeenCalledWith("agent");
  });

  it("renders feature flag toggles in query mode", () => {
    render(<QueryBar question="" onQuestionChange={noop} mode="query" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    expect(screen.getByRole("button", { name: /hyde/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crag/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /self-rag/i })).toBeInTheDocument();
  });

  it("hides feature flag toggles in agent mode", () => {
    render(<QueryBar question="" onQuestionChange={noop} mode="agent" onModeChange={noop} flags={FLAGS} onFlagsChange={noop} onSubmit={noop} disabled={false} />);
    expect(screen.queryByRole("button", { name: /hyde/i })).not.toBeInTheDocument();
  });
});
