export function trimQuotes(s: string): string {
  return s && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s;
}
