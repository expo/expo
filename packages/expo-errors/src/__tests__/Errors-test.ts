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
  describe('warnings', () => {
    const originalWarning = console.warn;

    afterEach(() => {
      console.warn = originalWarning;
    });

    it(`warns of a future replacement`, async () => {
      console.warn = jest.fn();

      Errors.deprecate('expo-errors', 'foo', {
        replacement: 'bar',
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect((console.warn as any).mock.calls[0]).toMatchSnapshot();
    });

    it(`warns of a future deprecation`, async () => {
      console.warn = jest.fn();

      Errors.deprecate('expo-errors', 'foo', {
        currentVersion: '1.0.0',
        versionToRemove: '2.0.0',
      });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect((console.warn as any).mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('errors', () => {
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

    it(`throws a deprecation error after expiration`, async () => {
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
        expect(error!.code).toBe('ERR_DEPRECATED_API');
      }
    });
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
