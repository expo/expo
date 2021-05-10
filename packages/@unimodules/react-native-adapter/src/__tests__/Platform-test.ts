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
