import { describe, it, expect } from "vitest";
import { parseYouTubeId } from "@/lib/youtube";

describe("parseYouTubeId", () => {
  it("parses https://www.youtube.com/watch?v=<id>", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://youtu.be/<id>", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://www.youtube.com/embed/<id>", () => {
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://m.youtube.com/watch?v=<id>", () => {
    expect(parseYouTubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("accepts a bare 11-char id", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("ignores extra query parameters", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for non-youtube urls", () => {
    expect(parseYouTubeId("https://vimeo.com/123456")).toBeNull();
  });
  it("returns null for garbage", () => {
    expect(parseYouTubeId("not a url")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseYouTubeId("")).toBeNull();
  });
  it("trims whitespace", () => {
    expect(parseYouTubeId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });
});
