import { attachImportStackToRootMessage, nearestImportStack } from '../metroErrorInterface';

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

    console.log('test', actual.message);

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
