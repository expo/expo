import Platform from '../Platform';

// Sanity check for each platform
it(`matches snapshots`, () => {
  expect({
    // Each platform
    OS: Platform.OS,
    // Should be web only
    isDOMAvailable: Platform.isDOMAvailable,
    canUseEventListeners: Platform.canUseEventListeners,
    canUseViewport: Platform.canUseViewport,
    isNative: Platform.select({ native: true, default: false }),
    isWeb: Platform.select({ web: true, default: false }),
  }).toMatchSnapshot();
});

describe('isQuest', () => {
  const originalExpoGlobal = globalThis.expo;

  afterEach(() => {
    globalThis.expo = originalExpoGlobal;
  });

  function loadPlatform(): typeof Platform {
    let isolatedPlatform!: typeof Platform;
    jest.isolateModules(() => {
      isolatedPlatform = require('../Platform').default;
    });
    return isolatedPlatform;
  }

  it('is true when the native runtime reports a Meta Quest device', () => {
    globalThis.expo = { ...originalExpoGlobal, isRunningOnQuest: true };
    expect(loadPlatform().isQuest).toBe(true);
  });

  it('is false when the expo global is not installed', () => {
    globalThis.expo = undefined as any;
    expect(loadPlatform().isQuest).toBe(false);
  });
});
