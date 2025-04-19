export function getBlah(): string | null {
  const a: string | null = Math.random() ? '' : null;
  const b: string | null = Math.random() ? '' : null;
  return a || b;
}
