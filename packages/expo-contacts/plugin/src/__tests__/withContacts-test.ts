import type { ExpoConfig } from 'expo/config';
import type { AndroidConfig, ExportedConfig } from 'expo/config-plugins';

import withContacts, { type Props } from '../withContacts';

describe('withContacts Android permissions', () => {
  it('adds READ_CONTACTS and WRITE_CONTACTS to the manifest when no props are passed', async () => {
    const config: ExportedConfig = withContacts(fakeConfig());
    const permissions = await evalManifestPermissionsAsync(config);
    expect(permissions).toEqual([
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
    ]);
  });

  it('adds no permissions to the manifest when both Android props are false', async () => {
    const props: Props = { readContactsAndroid: false, writeContactsAndroid: false };
    const config: ExportedConfig = withContacts(fakeConfig(), props);
    const permissions = await evalManifestPermissionsAsync(config);
    expect(permissions).toEqual([]);
  });
});

function fakeConfig(): ExpoConfig {
  return { name: 'test', slug: 'test' };
}

function emptyManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
    },
  };
}

async function evalManifestPermissionsAsync(config: ExportedConfig): Promise<string[]> {
  const mod = config.mods?.android?.manifest;
  if (!mod) {
    throw new Error('Expected the Android manifest mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults: emptyManifest(),
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/android',
      modName: 'manifest',
      platform: 'android',
      introspect: true,
    },
    modRawConfig: config,
  });
  const usesPermissions = result.modResults.manifest['uses-permission'] ?? [];
  return usesPermissions.map((permission) => permission.$['android:name']);
}
