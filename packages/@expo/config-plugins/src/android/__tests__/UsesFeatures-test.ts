import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import type { AndroidManifest } from '../Manifest';
import { setUsesFeatures, withUsesFeatures } from '../UsesFeatures';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

describe(setUsesFeatures, () => {
  it(`adds features with and without required false`, async () => {
    const manifest = setUsesFeatures(
      {
        android: {
          usesFeatures: [
            { name: 'android.hardware.wifi', required: false },
            { name: 'android.hardware.camera' },
            { name: 'android.hardware.nfc', required: true },
          ],
        },
      },
      await getFixtureManifestAsync()
    );

    expect(manifest.manifest['uses-feature']).toEqual([
      { $: { 'android:name': 'android.hardware.wifi', 'android:required': 'false' } },
      { $: { 'android:name': 'android.hardware.camera' } },
      { $: { 'android:name': 'android.hardware.nfc' } },
    ]);
  });

  it(`writes the features before the application element`, async () => {
    const manifest = setUsesFeatures(
      { android: { usesFeatures: [{ name: 'android.hardware.wifi', required: false }] } },
      await getFixtureManifestAsync()
    );

    const xml = XML.format(manifest);
    expect(xml).toContain(
      '<uses-feature android:name="android.hardware.wifi" android:required="false"/>'
    );
    expect(xml.indexOf('<uses-feature')).toBeLessThan(xml.indexOf('<application'));
  });

  it(`does not duplicate features when it runs two times`, async () => {
    const config = {
      android: { usesFeatures: [{ name: 'android.hardware.wifi', required: false }] },
    };
    const manifest = setUsesFeatures(
      config,
      setUsesFeatures(config, await getFixtureManifestAsync())
    );

    expect(manifest.manifest['uses-feature']).toEqual([
      { $: { 'android:name': 'android.hardware.wifi', 'android:required': 'false' } },
    ]);
  });

  it(`writes one feature when the config repeats a name`, async () => {
    const manifest = setUsesFeatures(
      {
        android: {
          usesFeatures: [
            { name: 'android.hardware.wifi' },
            { name: 'android.hardware.wifi', required: false },
          ],
        },
      },
      await getFixtureManifestAsync()
    );

    expect(manifest.manifest['uses-feature']).toEqual([
      { $: { 'android:name': 'android.hardware.wifi', 'android:required': 'false' } },
    ]);
  });

  it(`replaces a feature with the same name and keeps other features`, async () => {
    const fixture = await getFixtureManifestAsync();
    fixture.manifest['uses-feature'] = [
      { $: { 'android:name': 'android.hardware.wifi' } },
      { $: { 'android:name': 'android.hardware.bluetooth', 'android:required': 'false' } },
    ];

    const manifest = setUsesFeatures(
      { android: { usesFeatures: [{ name: 'android.hardware.wifi', required: false }] } },
      fixture
    );

    expect(manifest.manifest['uses-feature']).toEqual([
      { $: { 'android:name': 'android.hardware.bluetooth', 'android:required': 'false' } },
      { $: { 'android:name': 'android.hardware.wifi', 'android:required': 'false' } },
    ]);
  });
});

describe(withUsesFeatures, () => {
  it(`does not modify the manifest without usesFeatures`, () => {
    const config = withUsesFeatures({ name: '', slug: '', android: {} });

    expect((config as any).mods?.android?.manifest).toBeUndefined();
  });
});
