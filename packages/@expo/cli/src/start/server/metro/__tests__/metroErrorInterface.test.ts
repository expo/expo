import {
  attachImportStackToRootMessage,
  nearestImportStack,
  likelyContainsCodeFrame,
  dropStackIfContainsCodeFrame,
} from '../metroErrorInterface';

type ErrorWithImportStack = Error & {
  _expoImportStack?: string;
  cause?: ErrorWithImportStack;
};

describe('attachImportStackToRootMessage', () => {
  it('no change to error', () => {
    const actual = new Error('Test error');
    attachImportStackToRootMessage(actual);

    expect(actual).toEqual(new Error('Test error'));
    expect(actual.stack).toBeDefined();
  });

  it('import from root', () => {
    const actual: ErrorWithImportStack = new Error('Test error');
    actual._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.stack).toBeUndefined();
  });

  it('import from root', () => {
    const actual: ErrorWithImportStack = new Error('Test error');
    actual._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from direct cause', () => {
    const actual: ErrorWithImportStack = new Error('Test error');
    actual.cause = new Error('Direct cause');
    actual.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from cause chain', () => {
    const actual: ErrorWithImportStack = new Error('Test error');
    actual.cause = new Error('Direct cause');
    actual.cause.cause = new Error('Indirect cause');
    actual.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from nearest cause in chain', () => {
    const actual: ErrorWithImportStack = new Error('Test error');
    actual.cause = new Error('Direct cause');
    actual.cause.cause = new Error('Indirect cause');
    actual.cause.cause.cause = new Error('Another indirect cause');
    actual.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    actual.cause.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useApples.ts
        | import "not-existing-module-2"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });
});

describe('nearestImportStack', () => {
  it('returns undefined for non-error', () => {
    expect(nearestImportStack('not an error')).toBeUndefined();
  });

  it('returns undefined when no import stack exists', () => {
    expect(nearestImportStack(new Error('Test error'))).toBeUndefined();
  });

  it('returns import stack from root error', () => {
    const error: ErrorWithImportStack = new Error('Test error');
    error._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from direct cause', () => {
    const error: ErrorWithImportStack = new Error('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from deeper in cause chain', () => {
    const error: ErrorWithImportStack = new Error('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    error.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from nearest cause in chain', () => {
    const error: ErrorWithImportStack = new Error('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    error.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    // Add another cause with an import stack that should be ignored
    error.cause.cause.cause = new Error('Another indirect cause') as ErrorWithImportStack;
    error.cause.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useApples.ts
        | import "not-existing-module-2"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });
});

describe('likelyContainsCodeFrame', () => {
  it('returns false for undefined', () => {
    expect(likelyContainsCodeFrame(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(likelyContainsCodeFrame('')).toBe(false);
  });

  it('returns false for non-code frame message', () => {
    expect(likelyContainsCodeFrame('This is a regular error message')).toBe(false);
  });

  it('returns true for code frame message', () => {
    expect(
      likelyContainsCodeFrame(`
SyntaxError: hooks/useBananas.ts: Unexpected token (3:9)

  2 | import { FruitLabelPrefix } from './useFruit';
> 3 | import { [] } from './useFruit';
    |          ^
  4 |
  5 | export function useBananas() {
    `)
    ).toBe(true);
  });

  it('returns true for code frame with ANSI colors', () => {
    expect(
      likelyContainsCodeFrame(`
\x1b[31mSyntaxError: hooks/useBananas.ts: Unexpected token (3:9)\x1b[0m

\x1b[90m  2 |\x1b[0m import { FruitLabelPrefix } from './useFruit';
\x1b[31m> 3 |\x1b[0m import { [] } from './useFruit';
\x1b[31m    |\x1b[0m          \x1b[31m^\x1b[0m
\x1b[90m  4 |\x1b[0m
\x1b[90m  5 |\x1b[0m export function useBananas() {
      `)
    ).toBe(true);
  });
});

describe('dropStackIfContainsCodeFrame', () => {
  it('keeps stack if no code frame', () => {
    const error = new Error('This is a regular error message');
    const originalStack = error.stack;
    dropStackIfContainsCodeFrame(error);
    expect(error.stack).toEqual(originalStack);
  });

  it('drops stack if code frame is present', () => {
    const error = new Error(`
\x1b[31mSyntaxError: hooks/useBananas.ts: Unexpected token (3:9)\x1b[0m

\x1b[90m  2 |\x1b[0m import { FruitLabelPrefix } from './useFruit';
\x1b[31m> 3 |\x1b[0m import { [] } from './useFruit';
\x1b[31m    |\x1b[0m          \x1b[31m^\x1b[0m
\x1b[90m  4 |\x1b[0m
\x1b[90m  5 |\x1b[0m export function useBananas() {
      `);
    dropStackIfContainsCodeFrame(error);
    expect(error.stack).toBeUndefined();
  });
});
