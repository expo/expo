import { escapeString } from '..';

describe(escapeString, () => {
  it('passes plain strings through', () => {
    expect(escapeString('hello')).toBe('hello');
    expect(escapeString('/Users/example/project')).toBe('/Users/example/project');
  });

  it('escapes double quotes', () => {
    expect(escapeString('say "hi"')).toBe('say \\"hi\\"');
  });

  it('escapes backslashes before other escapes so they do not double-encode', () => {
    expect(escapeString('a\\b')).toBe('a\\\\b');
    expect(escapeString('a\\"b')).toBe('a\\\\\\"b');
  });

  it('escapes control whitespace AppleScript supports', () => {
    expect(escapeString('a\nb\rc\td')).toBe('a\\nb\\rc\\td');
  });

  it('leaves single quotes alone (AppleScript does not treat them specially)', () => {
    expect(escapeString("it's fine")).toBe("it's fine");
  });
});
