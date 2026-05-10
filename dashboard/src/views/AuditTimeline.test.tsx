import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditTimeline } from "./AuditTimeline";
import { MOCK_AUDIT_EVENTS } from "../lib/mock";

describe("AuditTimeline", () => {
  it("renders the empty state when no events", () => {
    render(<AuditTimeline events={null} fromMock />);
    expect(screen.getByText(/no audit events|audit logging disabled/i)).toBeInTheDocument();
  });

  it("renders when audit_enabled is false on the server", () => {
    render(<AuditTimeline events={{ events: [], total: 0, audit_enabled: false }} fromMock={false} />);
    expect(screen.getByText(/audit logging disabled/i)).toBeInTheDocument();
  });

  it("renders all event endpoint paths", () => {
    render(<AuditTimeline events={MOCK_AUDIT_EVENTS} fromMock />);
    expect(screen.getAllByText(/\/query/).length).toBeGreaterThan(0);
  });

  it("flags mock vs live", () => {
    render(<AuditTimeline events={MOCK_AUDIT_EVENTS} fromMock={true} />);
    expect(screen.getByText(/offline · mock/i)).toBeInTheDocument();
  });
});
