import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/theme")>();
  return { ...actual, getPortrait: (theme: Parameters<typeof actual.getPortrait>[0], id: string, name: string) =>
    id === "missing-portrait" ? "" : actual.getPortrait(theme, id, name) };
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

async function liveApi(fetcher: ReturnType<typeof vi.fn>) {
  vi.stubEnv("VITE_USE_MOCK_API", "false");
  vi.stubGlobal("fetch", fetcher);
  return import("@/api/client");
}

describe("live attachment contract", () => {
  it("uploads multipart using the file field without a JSON content type", async () => {
    const attachment = { id: "att-1", filename: "feedback.txt", content_type: "text/plain", size_bytes: 8, created_at: "2026-10-25T07:45:00Z", has_text_excerpt: true };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(attachment), { status: 201 }));
    const api = await liveApi(fetcher);
    const file = new File(["feedback"], "feedback.txt", { type: "text/plain" });
    expect(await api.uploadAttachment(file)).toEqual(attachment);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://questmaster.tech/api/attachments");
    expect(init.method).toBe("POST");
    expect(init.body.get("file")).toBe(file);
    expect(init.headers).toBeUndefined();
  });

  it("removes an uploaded attachment using DELETE and handles 204", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const api = await liveApi(fetcher);
    await api.deleteAttachment("att-1");
    expect(fetcher).toHaveBeenCalledWith("https://questmaster.tech/api/attachments/att-1", expect.objectContaining({ method: "DELETE" }));
  });

  it("passes uploaded IDs to planning without calling team saving endpoints", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ team: { id: "t", team_name: "Live team", summary: "", agents: [] }, fallback_used: false, planner_source: "LLM" })));
    const api = await liveApi(fetcher);
    await api.planTeam("Analyze my file", "professional", ["att-1", "att-2"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://questmaster.tech/api/teams/plan");
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toMatchObject({ goal: "Analyze my file", interface_theme: "professional", attachment_ids: ["att-1", "att-2"] });
  });

  it("passes the same attachment IDs to execution and run context", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ run_id: "r", status: "PLANNING" }), { status: 202 }));
    const api = await liveApi(fetcher);
    await api.createRun({ goal: "Analyze my file", team: { id: "t", team_name: "Live team", summary: "", agents: [] }, customerId: "customer-stable", attachment_ids: ["att-1", "att-2"] });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://questmaster.tech/api/runs");
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toMatchObject({ attachment_ids: ["att-1", "att-2"], context: { attachment_ids: ["att-1", "att-2"], customer_id: "customer-stable" } });
  });

  it.each(["upload", "plan"])("preserves backend error.message for %s errors", async (action) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Attachment text could not be read" } }), { status: 422 }));
    const api = await liveApi(fetcher);
    const promise = action === "upload" ? api.uploadAttachment(new File(["text"], "input.txt")) : api.planTeam("Read text", "fantasy", ["att-1"]);
    await expect(promise).rejects.toThrow("Attachment text could not be read");
  });

  it.each(["fantasy", "professional", "toyota"] as const)("fills an empty normalized portrait from the %s pool by index", async (theme) => {
    const api = await liveApi(vi.fn());
    const { getThemePortraitByIndex } = await import("@/lib/theme");
    const agents = api.normalizeAgents([{ id: "missing-portrait", portrait: " " }, { id: "missing-portrait", portrait: "" }], theme);
    expect(agents[0]?.portrait).toBe(getThemePortraitByIndex(theme, 0));
    expect(agents[1]?.portrait).toBe(getThemePortraitByIndex(theme, 1));
    expect(agents[0]?.portrait).not.toBe(agents[1]?.portrait);
  });
});