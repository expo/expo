import { escapeStringRegexp } from '../escapeStringRegexp';

it('escapes characters with special meaning in a regular expression', () => {
  expect(escapeStringRegexp('|\\{}()[]^$+*?.')).toBe('\\|\\\\\\{\\}\\(\\)\\[\\]\\^\\$\\+\\*\\?\\.');
});

it('escapes a hyphen as \\x2d so it stays literal inside character classes', () => {
  expect(escapeStringRegexp('foo-bar')).toBe('foo\\x2dbar');
});

it('leaves characters without special meaning untouched', () => {
  expect(escapeStringRegexp('foo/bar_baz 123')).toBe('foo/bar_baz 123');
});

it('produces a pattern that matches the original string literally', () => {
  const value = '(group)/post/[id]-v1.0+beta';
  expect(new RegExp(`^${escapeStringRegexp(value)}$`).test(value)).toBe(true);
});
