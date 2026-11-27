import { resolve } from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import type { AndroidManifest } from '../Manifest';
import { getMainActivity, readAndroidManifestAsync } from '../Manifest';
import {
  appendScheme,
  ensureManifestHasValidIntentFilter,
  getScheme,
  getSchemesFromManifest,
  hasScheme,
  removeScheme,
  setScheme,
} from '../Scheme';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestWithHostPath = resolve(
  fixturesPath,
  'react-native-AndroidManifest-with-host.xml'
);

describe('scheme', () => {
  it(`returns empty array if no scheme is provided`, () => {
    expect(getScheme({})).toStrictEqual([]);
  });

  it(`returns the scheme if provided`, () => {
    expect(getScheme({ scheme: 'myapp' })).toStrictEqual(['myapp']);
    expect(getScheme({ scheme: ['other', 'myapp'] })).toStrictEqual(['other', 'myapp']);
    expect(
      getScheme({
        scheme: [
          'other',
          'myapp',
          // @ts-expect-error
          null,
        ],
      })
    ).toStrictEqual(['other', 'myapp']);
  });

  it('does not add scheme if none provided', async () => {
    let androidManifestJson = await getFixtureManifestAsync();
    androidManifestJson = await setScheme({}, androidManifestJson);

    expect(androidManifestJson).toEqual(androidManifestJson);
  });

  it('adds scheme to android manifest', async () => {
    let androidManifestJson = await getFixtureManifestAsync();
    androidManifestJson = await setScheme(
      {
        scheme: 'myapp',
        android: {
          scheme: ['android-only'],
          package: 'com.demo.value',
        },
      },
      androidManifestJson
    );

    const mainActivity = getMainActivity(androidManifestJson);
    const intentFilters = mainActivity!['intent-filter']!;

    const schemeIntent: string[] = [];

    for (const intent of intentFilters) {
      if ('data' in intent) {
        for (const dataFilter of intent.data!) {
          const possibleScheme = dataFilter.$['android:scheme'];
          if (possibleScheme) {
            schemeIntent.push(possibleScheme);
          }
        }
      }
    }

    expect(schemeIntent).toStrictEqual(['myapp', 'android-only']);
  });
});

function removeSingleTaskFromActivities(manifest: AndroidManifest) {
  for (const application of manifest.manifest.application ?? []) {
    for (const activity of application.activity ?? []) {
      if (activity.$['android:launchMode'] === 'singleTask') {
        delete activity.$['android:launchMode'];
      }
    }
  }

  return manifest;
}

describe('Schemes', () => {
  it('reads singleTop launcher schemes while preserving write scope', async () => {
    const manifest = await getFixtureManifestAsync();
    appendScheme('myapp', manifest);
    appendScheme('exp+myapp', manifest);
    const main = getMainActivity(manifest)!;
    main.$['android:launchMode'] = 'singleTop';

    expect(getSchemesFromManifest(manifest)).toEqual(['myapp', 'exp+myapp']);
    expect(hasScheme('exp+myapp', manifest)).toBe(false);
    for (const launchMode of ['standard', undefined] as const) {
      main.$['android:launchMode'] = launchMode;
      expect(getSchemesFromManifest(manifest)).toEqual([]);
    }
    main.$['android:launchMode'] = 'singleTop';

    const target = structuredClone(main);
    target.$['android:name'] = '.OtherActivity';
    target.$['android:launchMode'] = 'singleTask';
    target['intent-filter'] = [
      {
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      },
    ];
    manifest.manifest.application![0]!.activity!.push(target);
    setScheme({ scheme: 'exp+myapp' }, manifest);
    expect(target['intent-filter'][0]!.data).toEqual([{ $: { 'android:scheme': 'exp+myapp' } }]);
    expect(hasScheme('exp+myapp', manifest)).toBe(true);
  });

  it('keeps callback schemes from suppressing writes to the singleTask activity', async () => {
    const manifest = await getFixtureManifestAsync();
    const main = getMainActivity(manifest)!;
    const callback = structuredClone(main);
    callback.$['android:name'] = '.AuthCallbackActivity';
    callback.$['android:launchMode'] = 'singleTop';
    callback['intent-filter'] = [
      {
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'myapp', 'android:host': 'auth' } }],
      },
    ];
    manifest.manifest.application![0]!.activity!.push(callback);
    // Read the launcher in singleTop mode before checking the existing write contract.
    main.$['android:launchMode'] = 'singleTop';
    main['intent-filter']!.push({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      data: [{ $: { 'android:scheme': 'exp+myapp' } }],
    });
    expect(getSchemesFromManifest(manifest)).toEqual(['exp+myapp']);
    main.$['android:launchMode'] = 'singleTask';
    setScheme({ scheme: 'myapp' }, manifest);
    setScheme({ scheme: 'myapp' }, manifest);
    expect(
      main['intent-filter']!.flatMap((filter) => filter.data ?? []).filter(
        (data) => data.$['android:scheme'] === 'myapp'
      )
    ).toEqual([{ $: { 'android:scheme': 'myapp' } }]);
    removeScheme('myapp', manifest);
    expect(hasScheme('myapp', manifest)).toBe(false);
    expect(callback['intent-filter']![0]!.data![0]!.$['android:host']).toBe('auth');
  });

  it(`ensure manifest has valid intent filter added`, async () => {
    const manifest = await getFixtureManifestAsync();
    const manifestHasValidIntentFilter = ensureManifestHasValidIntentFilter(manifest);
    expect(manifestHasValidIntentFilter).toBe(true);
  });

  it(`detect if no singleTask Activity exists`, async () => {
    const manifest = await getFixtureManifestAsync();
    removeSingleTaskFromActivities(manifest);

    expect(ensureManifestHasValidIntentFilter(manifest)).toBe(false);
  });

  it(`adds and removes a new scheme`, async () => {
    const manifest = await getFixtureManifestAsync();
    ensureManifestHasValidIntentFilter(manifest);

    const modifiedManifest = appendScheme('myapp.test', manifest);
    const schemes = getSchemesFromManifest(modifiedManifest);
    expect(schemes).toContain('myapp.test');
    const removedManifest = removeScheme('myapp.test', manifest);
    expect(getSchemesFromManifest(removedManifest)).not.toContain('myapp.test');
  });

  it(`get all schemes for the host`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestWithHostPath);
    ensureManifestHasValidIntentFilter(manifest);
    expect(hasScheme('longestschemewiththehost', manifest)).toBe(true);

    const modifiedManifest = appendScheme('myapp.test', manifest);
    let schemes = getSchemesFromManifest(modifiedManifest, 'any-host');
    expect(schemes).toContain('myapp.test');
    expect(schemes).not.toContain('longestschemewiththehost');

    schemes = getSchemesFromManifest(modifiedManifest, 'expo-development-client');
    expect(schemes).toContain('myapp.test');
    expect(schemes).toContain('longestschemewiththehost');
  });

  it(`detect when a duplicate might be added`, async () => {
    const manifest = await getFixtureManifestAsync();
    ensureManifestHasValidIntentFilter(manifest);

    const modifiedManifest = appendScheme('myapp.test', manifest);
    expect(hasScheme('myapp.test', modifiedManifest)).toBe(true);
  });

  it(`detect a non-existent scheme`, async () => {
    const manifest = await getFixtureManifestAsync();

    expect(hasScheme('myapp.test', manifest)).toBe(false);
  });
});
