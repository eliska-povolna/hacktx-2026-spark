import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AuthProvider, hashPassword, useAuth } from "@/lib/auth";

function Harness() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.isAuthenticated ? "in" : "out"}</span>
      <button onClick={() => auth.signup("Avery", "avery@example.com", "secret-pw")}>signup</button>
      <button onClick={() => auth.login("avery@example.com", "secret-pw", true)}>login</button>
      <button onClick={() => auth.login("avery@example.com", "wrong-pw", true).catch(() => {})}>
        bad-login
      </button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  );
}

describe("demo auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("hashes passwords deterministically with a salt", async () => {
    const a = await hashPassword("secret-pw");
    const b = await hashPassword("secret-pw");
    const c = await hashPassword("other-pw");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain("secret-pw");
  });

  it("never stores plaintext passwords and keeps login/logout working", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("signup").click();
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(screen.getByTestId("status").textContent).toBe("in");

    const stored = localStorage.getItem("questmaster.accounts") ?? "";
    expect(stored).not.toContain("secret-pw");
    expect(stored).toContain("passHash");

    await act(async () => {
      screen.getByText("logout").click();
    });
    expect(screen.getByTestId("status").textContent).toBe("out");

    await act(async () => {
      screen.getByText("login").click();
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(screen.getByTestId("status").textContent).toBe("in");

    await act(async () => {
      screen.getByText("logout").click();
    });
    await act(async () => {
      screen.getByText("bad-login").click();
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(screen.getByTestId("status").textContent).toBe("out");
  });
});
