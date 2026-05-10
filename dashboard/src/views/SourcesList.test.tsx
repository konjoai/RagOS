import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SourcesList } from "./SourcesList";
import { MOCK_QUERY_RESPONSE } from "../lib/mock";

describe("SourcesList", () => {
  it("renders an empty hint when no sources", () => {
    render(<SourcesList sources={[]} onSelect={() => {}} />);
    expect(screen.getByText(/no sources yet/i)).toBeInTheDocument();
  });

  it("renders all source paths and reranker scores", () => {
    render(<SourcesList sources={MOCK_QUERY_RESPONSE.sources} onSelect={() => {}} />);
    for (const s of MOCK_QUERY_RESPONSE.sources) {
      expect(screen.getByText(s.source)).toBeInTheDocument();
      expect(screen.getByText(s.score.toFixed(3))).toBeInTheDocument();
    }
  });

  it("renders CRAG classification labels when provided", () => {
    render(
      <SourcesList
        sources={MOCK_QUERY_RESPONSE.sources}
        cragClassification={MOCK_QUERY_RESPONSE.crag_classification}
        onSelect={() => {}}
      />,
    );
    expect(screen.getAllByText(/crag · /i).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the source + index", async () => {
    const cb = vi.fn();
    render(<SourcesList sources={MOCK_QUERY_RESPONSE.sources} onSelect={cb} />);
    await userEvent.click(screen.getByText(MOCK_QUERY_RESPONSE.sources[0].source));
    expect(cb).toHaveBeenCalledWith(MOCK_QUERY_RESPONSE.sources[0], 0);
  });
});
