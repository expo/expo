import { AndroidConfig, type AndroidManifest, type ExportedConfig } from 'expo/config-plugins';

import withObserve from '../withObserve';

const customerSupport = {
  NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCustomerSupport',
  NSPrivacyCollectedDataTypeLinked: false,
  NSPrivacyCollectedDataTypeTracking: false,
  NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
};

function createConfig(): ExportedConfig {
  return { name: 'test', slug: 'test' };
}

function createManifest(): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  };
}

async function runManifestMod(config: ExportedConfig): Promise<AndroidManifest> {
  const result = await config.mods!.android!.manifest!({
    ...config,
    modRawConfig: config,
    modResults: createManifest(),
    // The manifest mod does not read the request, so an empty one is enough.
    modRequest: {} as any,
  });
  return result.modResults;
}

describe('withObserve', () => {
  it('declares feedback in the privacy manifest and enables it on both platforms', async () => {
    const config = withObserve(createConfig(), { feedback: true });

    expect(config.ios?.privacyManifests?.NSPrivacyCollectedDataTypes).toEqual([customerSupport]);
    expect(config.ios?.infoPlist?.EXObserveFeedbackEnabled).toBe(true);

    const manifest = await runManifestMod(config);
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    expect(mainApplication['meta-data']).toContainEqual({
      $: { 'android:name': 'expo.modules.observe.FEEDBACK_ENABLED', 'android:value': 'true' },
    });
  });

  it('keeps existing privacy manifest entries', () => {
    const crashData = {
      NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
      NSPrivacyCollectedDataTypeLinked: false,
      NSPrivacyCollectedDataTypeTracking: false,
      NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
    };
    const config = withObserve(
      {
        ...createConfig(),
        ios: {
          infoPlist: { CFBundleName: 'test' },
          privacyManifests: { NSPrivacyTracking: false, NSPrivacyCollectedDataTypes: [crashData] },
        },
      },
      { feedback: true }
    );

    expect(config.ios?.privacyManifests).toEqual({
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [crashData, customerSupport],
    });
    expect(config.ios?.infoPlist).toEqual({ CFBundleName: 'test', EXObserveFeedbackEnabled: true });
  });

  it.each([undefined, {}, { feedback: false }])('changes nothing when props are %p', (props) => {
    const { _internal, ...config } = withObserve(createConfig(), props);

    expect(config).toEqual(createConfig());
  });
});
