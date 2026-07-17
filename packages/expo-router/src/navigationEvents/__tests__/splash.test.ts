jest.mock('../../views/Splash', () => ({ _internal_maybeHideAsync: jest.fn() }));

describe('splash screen on ready', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('hides the splash once across repeated ready calls, deferred a frame', () => {
    globalThis.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof requestAnimationFrame;

    const { handleSplashScreenOnReady } = require('../splash');
    const SplashScreen = require('../../views/Splash');

    handleSplashScreenOnReady();
    handleSplashScreenOnReady();

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(SplashScreen._internal_maybeHideAsync).toHaveBeenCalledTimes(1);
  });

  it('cancels a still-pending splash-hide frame', () => {
    globalThis.requestAnimationFrame = jest.fn(() => 42) as unknown as typeof requestAnimationFrame;
    const cancel = jest.fn();
    globalThis.cancelAnimationFrame = cancel as typeof cancelAnimationFrame;

    const { handleSplashScreenOnReady, cancelSplashScreenAnimationFrame } = require('../splash');
    const SplashScreen = require('../../views/Splash');

    handleSplashScreenOnReady();
    cancelSplashScreenAnimationFrame();

    expect(cancel).toHaveBeenCalledWith(42);
    // The frame never ran, so the splash was not hidden.
    expect(SplashScreen._internal_maybeHideAsync).not.toHaveBeenCalled();
    // A second cancel is a no-op (frame already cleared).
    cancelSplashScreenAnimationFrame();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
