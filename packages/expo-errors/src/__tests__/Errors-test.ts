import * as Errors from '../Errors';

describe('UnavailabilityError', () => {
  it(`has a constructor which takes a module and property name as parameters`, () => {
    let err = new Errors.UnavailabilityError('TestModule', 'someProperty');
    expect(err.code).toBe('ERR_UNAVAILABLE');
    expect(err.message).toContain('TestModule');
    expect(err.message).toContain('someProperty');
  });
});

describe('deprecate', () => {
  const originalWarning = console.warn;
  function isWarnedAsync() {
    return new Promise(resolve => {
      console.warn = (...args: any[]) => {
        resolve(args);
      };
    });
  }
  beforeEach(() => {
    console.warn = originalWarning;
  });
  afterAll(() => {
    console.warn = originalWarning;
  });

  it(`warns of a future replacement`, async () => {
    setTimeout(() => {
      Errors.deprecate('expo-errors', 'foo', {
        replacement: 'bar',
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });
    });
    const warning = await isWarnedAsync();
    expect(warning).toBeDefined();
  });

  it(`warns of a future deprecation`, async () => {
    setTimeout(() => {
      Errors.deprecate('expo-errors', 'foo', {
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });
    });
    const warning = await isWarnedAsync();
    expect(warning).toBeDefined();
  });

  it(`throws a deprecation error without expiration`, async () => {
    expect(() => Errors.deprecate('expo-errors', 'foo')).toThrowErrorMatchingSnapshot();
  });

  it(`throws an error with the replacement`, async () => {
    expect(() =>
      Errors.deprecate('expo-errors', 'foo', { replacement: 'bar' })
    ).toThrowErrorMatchingSnapshot();
  });

  it(`throws an error with the replacement after the expiration`, async () => {
    expect(() =>
      Errors.deprecate('expo-errors', 'foo', {
        replacement: 'bar',
        currentVersion: '2.0.0',
        versionToRemove: '1.0.0',
      })
    ).toThrowErrorMatchingSnapshot();
  });

  it(`throws a deprecation after expiration`, async () => {
    expect(() =>
      Errors.deprecate('expo-errors', 'foo', {
        currentVersion: '2.0.0',
        versionToRemove: '1.0.0',
      })
    ).toThrowErrorMatchingSnapshot();
  });

  it(`throws a CodedError with expected code`, async () => {
    const libraries = ['expo-camera', 'Expo.Camera'];
    for (const library of libraries) {
      const error = await getErrorAsync(() => {
        Errors.deprecate(library, 'foo');
      });
      expect(error).toBeDefined();
      expect(error!.code).toBe('ERR_DEPRECATED_API_EXPO_CAMERA');
    }
  });
});

function getErrorAsync(runnable): Promise<Errors.CodedError | null> {
  return new Promise(async resolve => {
    try {
      await runnable();
      resolve(null);
    } catch (error) {
      resolve(error);
    }
  });
}
