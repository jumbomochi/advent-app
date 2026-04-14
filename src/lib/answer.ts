export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matches(given: string, expected: string | null): boolean {
  if (!expected) return false;
  const g = normalize(given);
  if (!g) return false;
  return expected.split("|").some((alt) => normalize(alt) === g);
}
