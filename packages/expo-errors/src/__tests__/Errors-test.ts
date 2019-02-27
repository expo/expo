import * as Errors from '../Errors';

describe('UnavailabilityError', () => {
  it('has a constructor which takes a module and property name as parameters', () => {
    let err = new Errors.UnavailabilityError('TestModule', 'someProperty');
    expect(err.code).toBe('ERR_UNAVAILABLE');
    expect(err.message).toContain('TestModule');
    expect(err.message).toContain('someProperty');
  });
});

describe('warnDeprecated', () => {
  const originalWarning = console.warn;
  function isWarnedAsync() {
    return new Promise((resolve, reject) => {
      console.warn = (...args: any[]) => {
        resolve(args);
        // return originalWarning(...args);
      };
    });
  }
  beforeEach(() => {
    console.warn = originalWarning;
  });
  afterAll(() => {
    console.warn = originalWarning;
  });

  it('warns of a future replacement', async () => {
    setTimeout(() => {
      Errors.warnDeprecated('expo-errors', 'foo', {
        replacement: 'bar',
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });
    });
    const warning = await isWarnedAsync();
    expect(warning).toBeDefined();
  });

  it('warns of a future deprecation', async () => {
    setTimeout(() => {
      Errors.warnDeprecated('expo-errors', 'foo', {
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });
    });
    const warning = await isWarnedAsync();
    expect(warning).toBeDefined();
  });

  it('throws a deprecation without expiration', async () => {
    expect(() => Errors.warnDeprecated('expo-errors', 'foo')).toThrow();
  });

  it('throws a replacement without expiration', async () => {
    expect(() => Errors.warnDeprecated('expo-errors', 'foo', { replacement: 'bar' })).toThrow();
  });

  it('throws a replacement after expiration', async () => {
    expect(() =>
      Errors.warnDeprecated('expo-errors', 'foo', {
        replacement: 'bar',
        currentVersion: '2.0.0',
        versionToRemove: '1.0.0',
      })
    ).toThrow();
  });

  it('throws a deprecation after expiration', async () => {
    expect(() =>
      Errors.warnDeprecated('expo-errors', 'foo', {
        currentVersion: '2.0.0',
        versionToRemove: '1.0.0',
      })
    ).toThrow();
  });
});
