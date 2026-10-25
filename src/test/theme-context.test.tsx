import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { readTheme, ThemeProvider } from "@/lib/theme-context";
import { useTheme } from "@/lib/theme";

afterEach(() => { cleanup(); localStorage.clear(); });

it("starts a fresh user in Fantasy", () => {
  localStorage.clear();
  expect(readTheme()).toBe("fantasy");
});

it("shares the stable provider with consumers importing the theme facade", () => {
  function Consumer() {
    const { theme, setTheme } = useTheme();
    return <button onClick={() => setTheme("toyota")}>{theme}</button>;
  }
  render(<ThemeProvider><Consumer /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "fantasy" }));
  expect(screen.getByRole("button", { name: "toyota" })).toBeTruthy();
  expect(localStorage.getItem("questmaster.theme")).toBe("toyota");
});