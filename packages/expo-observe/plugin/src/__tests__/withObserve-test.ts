import type { AndroidConfig, ExportedConfig, Mod } from 'expo/config-plugins';

import withObserve from '../withObserve';

const CONSENT_META_DATA = 'expo.modules.observe.CONSENT';

async function evalModAsync<T>(
  config: ExportedConfig,
  platform: 'android' | 'ios',
  mod: Mod<T> | undefined,
  modResults: T
) {
  if (!mod) {
    throw new Error('Expected the mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/native',
      modName: 'test',
      platform,
      introspect: true,
    },
    modRawConfig: config,
  });
  return result.modResults;
}

// Runs the plugin on a fresh config, and returns the `Info.plist` and the consent `meta-data` items.
async function applyAsync(
  props?: Parameters<typeof withObserve>[1],
  metaData?: AndroidConfig.Manifest.ManifestMetaData[]
) {
  const config: ExportedConfig = withObserve({ name: 'test', slug: 'test' }, props);
  const infoPlist = await evalModAsync(config, 'ios', config.mods?.ios?.infoPlist, {});
  const manifest = await evalModAsync(config, 'android', config.mods?.android?.manifest, {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' }, 'meta-data': metaData }],
    },
  });
  const consentItems = manifest.manifest.application?.[0]?.['meta-data']?.filter(
    (item) => item.$['android:name'] === CONSENT_META_DATA
  );
  return { infoPlist, consentItems };
}

describe('withObserve', () => {
  it('writes the `consent` option to both native projects', async () => {
    const { infoPlist, consentItems } = await applyAsync({ consent: 'not-granted' });
    expect(infoPlist.EXObserveConsent).toBe('not-granted');
    expect(consentItems).toEqual([
      { $: { 'android:name': CONSENT_META_DATA, 'android:value': 'not-granted' } },
    ]);
  });

  it.each([undefined, {}])('writes `granted` when the props are %p', async (props) => {
    const { infoPlist, consentItems } = await applyAsync(props);
    expect(infoPlist.EXObserveConsent).toBe('granted');
    expect(consentItems).toEqual([
      { $: { 'android:name': CONSENT_META_DATA, 'android:value': 'granted' } },
    ]);
  });

  it('replaces the value that an earlier prebuild wrote', async () => {
    const { consentItems } = await applyAsync({}, [
      { $: { 'android:name': CONSENT_META_DATA, 'android:value': 'not-granted' } },
    ]);
    expect(consentItems).toEqual([
      { $: { 'android:name': CONSENT_META_DATA, 'android:value': 'granted' } },
    ]);
  });

  it.each(['denied', null, false, ''])('throws when `consent` is %p', (consent) => {
    expect(() =>
      // @ts-expect-error The test passes values that the type does not allow.
      withObserve({ name: 'test', slug: 'test' }, { consent })
    ).toThrow(/expo-observe.*consent.*'granted'.*'not-granted'/s);
  });
});
