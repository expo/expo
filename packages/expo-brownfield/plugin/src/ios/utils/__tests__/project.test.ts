import { getBuildConfigurationSettings } from '../project';

const COMMON = { PRODUCT_NAME: '"$(TARGET_NAME)"' };

/**
 * The brownfield target reuses the app target's "Bundle React Native code and images" phase, which
 * runs `react-native-xcode.sh`. That script skips bundling in Debug for the simulator unless
 * `FORCE_BUNDLING` is set, so without it a debug XCFramework ships with no `main.jsbundle`.
 */
describe('getBuildConfigurationSettings', () => {
  it('forces bundling in Debug when bundleInDebug is enabled', () => {
    const settings = getBuildConfigurationSettings(COMMON, true);

    expect(settings.Debug.FORCE_BUNDLING).toBe('1');
  });

  it('leaves Release alone — it always bundles', () => {
    const settings = getBuildConfigurationSettings(COMMON, true);

    expect(settings.Release.FORCE_BUNDLING).toBeUndefined();
  });

  it('does not force bundling when the option is off', () => {
    const settings = getBuildConfigurationSettings(COMMON, false);

    expect(settings.Debug.FORCE_BUNDLING).toBeUndefined();
    expect(settings.Release.FORCE_BUNDLING).toBeUndefined();
  });

  it('preserves the common settings in both configurations', () => {
    const settings = getBuildConfigurationSettings(COMMON, true);

    expect(settings.Debug.PRODUCT_NAME).toBe('"$(TARGET_NAME)"');
    expect(settings.Release.PRODUCT_NAME).toBe('"$(TARGET_NAME)"');
  });
});
