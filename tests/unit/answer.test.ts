import { describe, it, expect } from "vitest";
import { normalize, matches } from "@/lib/answer";

describe("normalize", () => {
  it("lowercases", () => expect(normalize("Cat")).toBe("cat"));
  it("trims", () => expect(normalize("  cat  ")).toBe("cat"));
  it("collapses whitespace", () => expect(normalize("a  b   c")).toBe("a b c"));
  it("handles empty", () => expect(normalize("")).toBe(""));
});

describe("matches", () => {
  it("exact match", () => expect(matches("cat", "cat")).toBe(true));
  it("alternates separated by |", () => {
    expect(matches("kitty", "cat|kitty|feline")).toBe(true);
    expect(matches("dog", "cat|kitty|feline")).toBe(false);
  });
  it("normalizes both sides", () => expect(matches("  CAT ", "cat")).toBe(true));
  it("empty answer never matches", () => expect(matches("", "cat")).toBe(false));
  it("null expected never matches", () => expect(matches("cat", null)).toBe(false));
});
