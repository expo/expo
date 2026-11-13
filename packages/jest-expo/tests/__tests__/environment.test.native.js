// Regression tests for `jest-expo/src/preset/nativeEnvironment.js`.

describe('native test environment', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears legacy fake timer mocks with jest.clearAllMocks()', () => {
    // Legacy fake timers create their mocks with the environment's module mocker. This only works
    // if the runtime and the fake timers share the same `ModuleMocker` instance.
    jest.useFakeTimers({ legacyFakeTimers: true });
    setTimeout(() => {}, 1);
    expect(setTimeout).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    expect(setTimeout).toHaveBeenCalledTimes(0);
  });

  it('does not evaluate lazy global getters when clearing mocks on the global scope', () => {
    let evaluated = false;
    Object.defineProperty(globalThis, '__expoLazyGlobalForTest', {
      configurable: true,
      enumerable: true,
      get() {
        evaluated = true;
        return jest.fn();
      },
    });
    try {
      jest.resetModules();
      expect(evaluated).toBe(false);
    } finally {
      delete globalThis.__expoLazyGlobalForTest;
    }
  });
});
