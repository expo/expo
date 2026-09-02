function printMatcherDiff(
  context: jest.MatcherContext,
  expected: unknown,
  received: unknown
): string {
  if (context.isNot) {
    return printMatcherValues(context, expected, received);
  }

  return context.utils.printDiffOrStringify(
    expected,
    received,
    'Expected',
    'Received',
    context.expand !== false
  );
}

function getMatcherHint(context: jest.MatcherContext, matcherName: string): string {
  return context.utils.matcherHint(matcherName, undefined, undefined, {
    isNot: context.isNot,
    promise: context.promise,
  });
}

function printMatcherValues(
  context: jest.MatcherContext,
  expected: unknown,
  received: unknown
): string {
  return (
    `Expected: ${context.isNot ? 'not ' : ''}${context.utils.printExpected(expected)}\n` +
    `Received: ${context.utils.printReceived(received)}`
  );
}

expect.extend({
  toHavePathname(screen, expected) {
    const received = screen.getPathname();
    const pass = this.equals(received, expected);
    return {
      pass,
      // Diffs add value for structured data, but are noise for short strings, so print raw values here.
      message: () =>
        getMatcherHint(this, 'toHavePathname') +
        '\n\n' +
        printMatcherValues(this, expected, received),
    };
  },
  toHavePathnameWithParams(screen, expected) {
    const received = screen.getPathnameWithParams();
    const pass = this.equals(received, expected);
    return {
      pass,
      // Diffs add value for structured data, but are noise for short strings, so print raw values here.
      message: () =>
        getMatcherHint(this, 'toHavePathnameWithParams') +
        '\n\n' +
        printMatcherValues(this, expected, received),
    };
  },
  toHaveSegments(screen, expected) {
    const received = screen.getSegments();
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        getMatcherHint(this, 'toHaveSegments') +
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
        getMatcherHint(this, 'toHaveSearchParams') +
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
        getMatcherHint(this, 'toHaveRouterState') +
        '\n\n' +
        printMatcherDiff(this, expected, received),
    };
  },
});
