/** @jest-environment node */
import { generateCases } from './generate.ts';

const prefixes = ['/guides/', '/build/', '/router/', '/tutorial/', '/ja/tutorial/'];
const versions = ['latest', 'v54.0.0', 'v55.0.0', 'v56.0.0', 'v57.0.0', 'v58.0.0'];
const inventory = [...prefixes, ...versions.map(version => `/versions/${version}/sdk/`)].flatMap(
  prefix => Array.from({ length: 80 }, (_, i) => ({ path: `${prefix}subject-${i}/` }))
);

test('generates reproducible provisional cases without leaking source families between splits', () => {
  const cases = generateCases(inventory, '');
  expect(generateCases([...inventory].reverse(), '')).toEqual(cases);
  expect(cases).toHaveLength(300);
  expect(new Set(cases.map(row => row.path)).size).toBe(cases.length);
  expect(cases.filter(row => row.expectedPaths.length === 0)).toHaveLength(60);
  const families = new Map<string, string>();
  for (const row of cases) {
    expect(row.reviewed).toBe(false);
    expect(row.expectedPaths).toEqual(row.category === 'no-match' ? [] : [row.sourcePath]);
    const prefix = /^\/(?:ja\/)?(?:versions\/[^/]+\/)?/;
    expect(row.path.match(prefix)?.[0]).toBe(row.sourcePath.match(prefix)?.[0]);
    const family = row.sourcePath
      .replace(/^\/ja\//, '/')
      .replace(/\/versions\/[^/]+\//, '/versions/*/');
    expect(families.get(family) ?? row.split).toBe(row.split);
    families.set(family, row.split);
  }
});

test('omits inventory paths and inputs covered by literal or wildcard redirects', () => {
  const [existing, literal, wildcard] = generateCases(inventory, '');
  const pages = [...inventory, { path: existing.path }];
  const cases = generateCases(
    pages,
    `${literal.path} /target/ 301\n${wildcard.path}* /target/ 301`
  );
  const inputs = cases.map(row => row.path);
  expect(inputs).not.toContain(existing.path);
  expect(inputs).not.toContain(literal.path);
  expect(inputs.some(input => input.startsWith(wildcard.path))).toBe(false);
  expect(inputs.some(input => pages.some(page => page.path === input))).toBe(false);
});
