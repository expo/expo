import { resolve } from 'path';

import { format } from '../../utils/XML';
import { readAndroidManifestAsync } from '../Manifest';
import {
  addBlockedPermissions,
  ensurePermission,
  ensurePermissions,
  getAndroidPermissions,
  getPermissions,
  removePermissions,
  setAndroidPermissions,
  withInternalBlockedPermissions,
} from '../Permissions';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

function getMockAndroidManifest() {
  return readAndroidManifestAsync(sampleManifestPath);
}

describe(withInternalBlockedPermissions, () => {
  it(`adds blocked permissions`, async () => {
    const config = withInternalBlockedPermissions({
      slug: '',
      name: '',
      android: {
        blockedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'OTHER'],
      },
    });

    const { modResults } = await (config as any).mods.android.manifest({
      modRequest: {},
      modResults: await getMockAndroidManifest(),
    });

    expect(modResults).toEqual({
      manifest: {
        $: {
          'xmlns:android': expect.any(String),
          package: expect.any(String),
          // Added tools
          'xmlns:tools': 'http://schemas.android.com/tools',
        },
        'uses-permission': [
          expect.anything(),
          // Added two blocked permissions
          {
            $: {
              'android:name': 'android.permission.ACCESS_FINE_LOCATION',
              'tools:node': 'remove',
            },
          },
          {
            $: {
              'android:name': 'OTHER',
              'tools:node': 'remove',
            },
          },
        ],
        queries: expect.anything(),
        application: expect.anything(),
      },
    });
  });

  it(`does not add tools if there are no blocked permissions`, async () => {
    const config = withInternalBlockedPermissions({
      slug: '',
      name: '',
      android: {
        blockedPermissions: [],
      },
    });

    // Doesn't even add the mod
    expect((config as any).mods).not.toBeDefined();
  });
});

describe(addBlockedPermissions, () => {
  it(`restricts an existing permission`, () => {
    expect(
      addBlockedPermissions(
        {
          manifest: {
            $: {
              'xmlns:android': '...',
            },
            'uses-permission': [
              {
                $: { 'android:name': 'foobar' },
              },
              {
                $: { 'android:name': 'foobar-2' },
              },
            ],
          },
        },
        ['foobar']
      ).manifest['uses-permission']
    ).toStrictEqual([
      {
        $: { 'android:name': 'foobar-2' },
      },
      {
        $: { 'android:name': 'foobar', 'tools:node': 'remove' },
      },
    ]);
  });

  it(`restricts a new permission`, () => {
    expect(
      addBlockedPermissions(
        {
          manifest: {
            $: {
              'xmlns:android': '...',
            },
            'uses-permission': [],
          },
        },
        ['foobar']
      ).manifest['uses-permission']
    ).toStrictEqual([
      {
        $: { 'android:name': 'foobar', 'tools:node': 'remove' },
      },
    ]);
  });
});

describe('Android permissions', () => {
  it(`returns empty array if no android permissions key is provided`, () => {
    expect(getAndroidPermissions({})).toMatchObject([]);
  });

  it(`returns android permissions if array is provided`, () => {
    expect(
      getAndroidPermissions({ android: { permissions: ['CAMERA', 'RECORD_AUDIO'] } })
    ).toMatchObject(['CAMERA', 'RECORD_AUDIO']);
  });

  it('adds permissions if not present, does not duplicate permissions', async () => {
    const givenPermissions = [
      'android.permission.READ_CONTACTS',
      'com.android.launcher.permission.INSTALL_SHORTCUT',
      'com.android.launcher.permission.INSTALL_SHORTCUT',
    ];
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = await setAndroidPermissions(
      { android: { permissions: givenPermissions } },
      androidManifestJson
    );

    const manifestPermissionsJSON = androidManifestJson.manifest['uses-permission'];
    const manifestPermissions = manifestPermissionsJSON.map(e => e.$['android:name']);

    // Account for INTERNET permission in fixture
    // No duplicates
    expect(manifestPermissions).toStrictEqual([
      'android.permission.INTERNET',
      'android.permission.READ_CONTACTS',
      'com.android.launcher.permission.INSTALL_SHORTCUT',
    ]);
    expect(
      manifestPermissions.filter(e => e === 'com.android.launcher.permission.INSTALL_SHORTCUT')
    ).toHaveLength(1);
  });
});

describe('Permissions', () => {
  it(`adds a new permission`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    const didAdd = ensurePermission(manifest, 'EXPO_TEST_PERMISSION');
    const permissions = getPermissions(manifest);
    expect(didAdd).toBe(true);
    expect(permissions).toContain('android.permission.EXPO_TEST_PERMISSION');
    expect(permissions.length).toBe(2);
  });

  it(`prevents adding a duplicate permission`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    const didAdd = ensurePermission(manifest, 'INTERNET');
    const permissions = getPermissions(manifest);
    expect(didAdd).toBe(false);
    expect(permissions).toContain('android.permission.INTERNET');
    expect(permissions.length).toBe(1);
  });

  it(`ensures multiple permissions`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    const permissionsToAdd = ['VALUE_1', 'VALUE_2'];
    const results = ensurePermissions(manifest, permissionsToAdd);
    expect(results).toMatchSnapshot();
    expect(Object.values(results)).toStrictEqual([true, true]);

    expect(getPermissions(manifest).length).toBe(3);
  });

  it(`removes permissions by name`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    expect(ensurePermission(manifest, 'VALUE_TO_REMOVE_1')).toBe(true);
    expect(ensurePermission(manifest, 'VALUE_TO_REMOVE_2')).toBe(true);
    expect(getPermissions(manifest).length).toBe(3);

    removePermissions(manifest, ['VALUE_TO_REMOVE_1', 'VALUE_TO_REMOVE_2']);
    expect(getPermissions(manifest).length).toBe(1);
  });

  it(`removes all permissions`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    expect(ensurePermission(manifest, 'VALUE_TO_REMOVE_1')).toBe(true);
    expect(ensurePermission(manifest, 'VALUE_TO_REMOVE_2')).toBe(true);
    expect(getPermissions(manifest).length).toBe(3);

    removePermissions(manifest);

    expect(getPermissions(manifest).length).toBe(0);
  });

  it(`can write with a pretty format`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    expect(ensurePermission(manifest, 'NEW_PERMISSION_1')).toBe(true);
    expect(ensurePermission(manifest, 'NEW_PERMISSION_2')).toBe(true);
    expect(getPermissions(manifest).length).toBe(3);

    expect(format(manifest)).toMatchSnapshot();
  });
});
