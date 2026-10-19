import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const REDIRECTS_FILE = fileURLToPath(new URL('../public/_redirects', import.meta.url));

// Cloudflare Pages hard limit for static (non-splat) rules.
const CLOUDFLARE_STATIC_RULE_LIMIT = 2000;

interface Rule {
  source: string;
  destination: string;
  status: string;
  line: number;
}

function parseRules(): Rule[] {
  return fs
    .readFileSync(REDIRECTS_FILE, 'utf8')
    .split('\n')
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw.length > 0 && !raw.startsWith('#'))
    .map(({ raw, line }) => {
      const [source, destination, status = '301'] = raw.split(/\s+/);
      return { source, destination, status, line };
    });
}

// Exact page rules are the ones the site can receive in both trailing-slash
// forms: no splats, no placeholders, no file extensions (like /index.md).
const isExactPageRule = (rule: Rule) =>
  !rule.source.includes('*') && !rule.source.includes(':') && !/\.[\da-z]+$/i.test(rule.source);

// Sibling rules may legitimately target the slash and slashless form of the
// same destination ("/mcp" and "/mcp/"); both resolve to the same page.
const normalizeDestination = (destination: string) =>
  destination.endsWith('/') ? destination.slice(0, -1) : destination;

describe('public/_redirects', () => {
  test('every exact page rule covers both trailing-slash forms', () => {
    const rules = parseRules();
    const bySource = new Map(rules.map(rule => [rule.source, rule]));
    const problems: string[] = [];

    for (const rule of rules.filter(isExactPageRule)) {
      const sibling = rule.source.endsWith('/') ? rule.source.slice(0, -1) : `${rule.source}/`;
      const match = bySource.get(sibling);
      if (!match) {
        problems.push(
          `${rule.source} (line ${rule.line}) has no ${sibling} variant, so one URL form will 404 instead of redirecting`
        );
      } else if (
        normalizeDestination(match.destination) !== normalizeDestination(rule.destination) ||
        match.status !== rule.status
      ) {
        problems.push(
          `${rule.source} (line ${rule.line}) and ${sibling} (line ${match.line}) disagree on destination or status`
        );
      }
    }

    expect(problems).toEqual([]);
  });

  test('stays within the Cloudflare Pages static rule limit', () => {
    expect(parseRules().length).toBeLessThanOrEqual(CLOUDFLARE_STATIC_RULE_LIMIT);
  });
});
