import { normalizePath } from './paths.ts';

export type RedirectRule = { source: string; destination: string; splat: boolean; regex?: RegExp };

export type ParsedRedirects = { literal: Map<string, string>; splats: RedirectRule[] };

export function parseRedirects(content: string): ParsedRedirects {
  const literal = new Map<string, string>();
  const splats: RedirectRule[] = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const [source, destination] = line.split(/\s+/);
    if (!source || !destination) {
      continue;
    }
    const normalizedDestination = destination.startsWith('/')
      ? normalizePath(destination)
      : destination;
    if (source.includes('*')) {
      const escaped = source.replace(/[$()+.?[\\\]^{|}]/g, String.raw`\$&`).replaceAll('*', '.*');
      splats.push({
        source,
        destination: normalizedDestination,
        splat: true,
        regex: new RegExp(`^${escaped}$`),
      });
    } else {
      literal.set(normalizePath(source), normalizedDestination);
    }
  }

  return { literal, splats };
}

export function validateRedirectTargets(
  redirects: ParsedRedirects,
  pages: Set<string>,
  files: Set<string>
): RedirectRule[] {
  const dangling: RedirectRule[] = [];
  const rules: RedirectRule[] = [
    ...[...redirects.literal.entries()].map(([source, destination]) => ({
      source,
      destination,
      splat: false,
    })),
    ...redirects.splats,
  ];

  for (const rule of rules) {
    if (rule.splat || !rule.destination.startsWith('/')) {
      continue;
    }
    const destination = normalizePath(rule.destination.split(/[#?]/)[0]);
    if (!pages.has(destination) && !files.has(destination) && !redirects.literal.has(destination)) {
      dangling.push(rule);
    }
  }

  return dangling;
}
