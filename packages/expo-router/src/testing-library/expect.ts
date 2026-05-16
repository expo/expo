function printMatcherDiff(
  context: jest.MatcherContext,
  expected: unknown,
  received: unknown
): string {
  return context.utils.printDiffOrStringify(
    expected,
    received,
    'Expected',
    'Received',
    context.expand !== false
  );
}

expect.extend({
  toHavePathname(screen, expected) {
    const received = screen.getPathname();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toHavePathname') +
        '\n\n' +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        `Received: ${this.utils.printReceived(received)}`,
    };
  },
  toHavePathnameWithParams(screen, expected) {
    const received = screen.getPathnameWithParams();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toHavePathnameWithParams') +
        '\n\n' +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        `Received: ${this.utils.printReceived(received)}`,
    };
  },
  toHaveSegments(screen, expected) {
    const received = screen.getSegments();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toHaveSegments') +
        '\n\n' +
        printMatcherDiff(this, expected, received),
    };
  },
  toHaveSearchParams(screen, expected) {
    const received = screen.getSearchParams();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toHaveSearchParams') +
        '\n\n' +
        printMatcherDiff(this, expected, received),
    };
  },
  toHaveRouterState(screen, expected) {
    const received = screen.getRouterState();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toHaveRouterState') +
        '\n\n' +
        printMatcherDiff(this, expected, received),
    };
  },
});
