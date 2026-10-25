import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { normalizeRun } from "@/api/client";
import { RunDetails } from "@/components/RunDetails";
import type { BackendRun } from "@/api/types";

const result = {
  purpose: "loan", narrative: "Financial summaries support this demo order.",
  candidates: [{ customer_id: "demo-a", name: "Demo Customer", score: 87, reasons: ["Low financial stress"], financial_summary: { financial_stress: "LOW", safe_mobility_budget: 500, nessie_provenance: "NESSIE_FALLBACK" } }],
  skipped_customers: [{ customer_id: "demo-b", name: "No-action Customer", reason: "Outside decision window" }],
};
const raw: BackendRun = { run_id: "portfolio", status: "COMPLETED", goal: "Loan opportunity", created_at: "2026-10-25T12:00:00Z", updated_at: "2026-10-25T12:00:00Z", portfolio_result: result };
afterEach(cleanup);

describe("portfolio result contract", () => {
  it("preserves portfolio data without inventing a single-customer recommendation", () => {
    const run = normalizeRun(raw);
    expect(run.portfolio_result).toEqual(result);
    expect(run.recommendation).toBeNull();
    expect(run.reward).toBeNull();
  });
  it("renders ranking, per-customer provenance and no-action customers", () => {
    render(<RunDetails run={normalizeRun(raw)} toyota showNessie />);
    expect(screen.getByRole("heading", { name: "Loan opportunity ranking" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Demo Customer" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "NESSIE_FALLBACK" })).toBeInTheDocument();
    expect(screen.getByText(/No-action Customer: Outside decision window/)).toBeInTheDocument();
    expect(screen.getByText(/not credit approval/)).toBeInTheDocument();
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
  });
  it("shows mobility priorities using the same persisted result shape", () => {
    render(<RunDetails run={normalizeRun({ ...raw, portfolio_result: { ...result, purpose: "mobility" } })} toyota />);
    expect(screen.getByRole("heading", { name: "Mobility priority ranking" })).toBeInTheDocument();
  });
});
