import { findMatchingBracketPosition } from '../matchBrackets';

describe(findMatchingBracketPosition, () => {
  it('should handle one line search', () => {
    expect(findMatchingBracketPosition('foo()', '(')).toBe(4);
    expect(findMatchingBracketPosition('withParameter("a", 1, null)', '(')).toBe(26);
  });

  it('should handle backward search', () => {
    expect(findMatchingBracketPosition('foo()', ')')).toBe(3);
    expect(findMatchingBracketPosition('withParameter("a", 1, null)', ')')).toBe(13);
  });

  it('should handle nested brackets call', () => {
    expect(findMatchingBracketPosition('foo(boo(), 0)', '(')).toBe(12);
  });

  it('should handle nested brackets multi-lines call', () => {
    const content = `
void foo() {
  doSomething();
  if (doSomeCheck(123)) {
    return -1;
  }
  return 0;
}`;
    const lastBrace = content.length - 1;
    expect(findMatchingBracketPosition(content, '{')).toBe(lastBrace);

    // `findMatchingBracketPosition` will search first `bracket` in forward direction first
    // and search matching bracket either forward or backward.
    // In this case, search `'}'` will match the ended bracket of `if (doSomeCheck(123)) {` block.
    const firstBrace = content.indexOf('{');
    const secondBrace = content.indexOf('{', firstBrace + 1);
    expect(findMatchingBracketPosition(content, '}')).toBe(secondBrace);
  });

  it('should return -1 for not found cases', () => {
    expect(findMatchingBracketPosition('', '(')).toBe(-1);
    expect(findMatchingBracketPosition('foo', '(')).toBe(-1);
    expect(findMatchingBracketPosition('foo(', '(')).toBe(-1);
    expect(findMatchingBracketPosition('foo()', '{')).toBe(-1);
    expect(findMatchingBracketPosition('foo()', '}')).toBe(-1);
    expect(findMatchingBracketPosition('foo(bar()', '(')).toBe(-1);
  });
});
