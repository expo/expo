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

function readRouterScreen(
  screen: unknown,
  method:
    | 'getPathname'
    | 'getPathnameWithParams'
    | 'getSegments'
    | 'getSearchParams'
    | 'getRouterState',
  matcherName: string
) {
  const fn = (screen as Record<string, unknown> | null | undefined)?.[method];
  if (typeof fn !== 'function') {
    throw new TypeError(
      `expect(received).${matcherName}: received value is not an expo-router render result. ` +
        `Call \`renderRouter()\` before asserting — and await it when using @testing-library/react-native v14: \`await renderRouter(...)\`.`
    );
  }
  return fn.call(screen);
}

expect.extend({
  toHavePathname(screen, expected) {
    const received = readRouterScreen(screen, 'getPathname', 'toHavePathname');
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
    const received = readRouterScreen(screen, 'getPathnameWithParams', 'toHavePathnameWithParams');
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
    const received = readRouterScreen(screen, 'getSegments', 'toHaveSegments');
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
    const received = readRouterScreen(screen, 'getSearchParams', 'toHaveSearchParams');
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
    const received = readRouterScreen(screen, 'getRouterState', 'toHaveRouterState');
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
