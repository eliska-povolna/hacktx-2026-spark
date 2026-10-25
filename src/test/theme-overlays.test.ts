import { describe, expect, it } from "vitest";

import { MOCK_AGENTS } from "@/api/mockData";
import { adaptMockText, getAgentsForTheme } from "@/lib/theme";

describe("theme presentation overlays", () => {
  it("applies Toyota roles, tools and least-privilege scopes to default agents", () => {
    const themed = getAgentsForTheme("toyota", MOCK_AGENTS);
    const maya = themed.find((a) => a.id === "maya")!;
    expect(maya.role).toBe("Financial Context Analyst");
    expect(maya.allowed_tools).toContain("Capital One Nessie");
    expect(maya.permissions.data_scopes).toEqual(["financial_context", "approved_financial_data"]);
    // Decision Specialist must not see raw financial transactions.
    const selene = themed.find((a) => a.id === "selene")!;
    expect(selene.permissions.data_scopes).not.toContain("approved_financial_data");
    expect(selene.permissions.data_scopes).toContain("financial_context");
  });

  it("applies Professional wording without fantasy tools or scopes", () => {
    const themed = getAgentsForTheme("professional", MOCK_AGENTS);
    const rowan = themed.find((a) => a.id === "rowan")!;
    expect(rowan.role).toBe("Research Analyst");
    expect(rowan.allowed_tools).not.toContain("Scroll Archive");
    expect(rowan.allowed_tools).toContain("Document Search");
    expect(rowan.permissions.data_scopes).toContain("customer_feedback");
    expect(rowan.permissions.data_scopes).not.toContain("guest_feedback");
  });

  it("leaves user-customized agents untouched by theme overlays", () => {
    const custom = { ...MOCK_AGENTS[0]!, role: "My Edited Role", customized: true };
    const themed = getAgentsForTheme("toyota", [custom]);
    expect(themed[0]!.role).toBe("My Edited Role");
    expect(themed[0]!.allowed_tools).toEqual(custom.allowed_tools);
  });
});

describe("adaptMockText", () => {
  it("keeps fantasy content unchanged", () => {
    expect(adaptMockText("fantasy", "Merchant Insight Party")).toBe("Merchant Insight Party");
  });

  it("maps fantasy names to Professional terminology", () => {
    expect(adaptMockText("professional", "Merchant Insight Party")).toBe("Customer Insight Team");
    expect(adaptMockText("professional", "Support Guild")).toBe("Support Operations Team");
    expect(adaptMockText("professional", "Adventurer completed task: Draft final report")).toBe(
      "Agent completed task: Draft final report",
    );
  });

  it("maps fantasy names to Toyota terminology", () => {
    expect(adaptMockText("toyota", "Merchant Insight Party")).toBe("Mobility Decision Team");
    expect(adaptMockText("toyota", "Scroll Archive used to read guest feedback")).toBe(
      "Knowledge Base used to read customer feedback",
    );
  });
});
