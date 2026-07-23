import { AndroidConfig } from 'expo/config-plugins';

import {
  convertBcp47ToResourceQualifier,
  setAndroidSupportsRtl,
} from '../src/withExpoLocalization';

function getManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      application: [{ $: { 'android:name': '.MainApplication' } }],
      queries: [],
    },
  };
}

describe('setAndroidSupportsRtl', () => {
  it('sets android:supportsRtl to "true"', () => {
    const manifest = setAndroidSupportsRtl(getManifest(), true);
    expect(manifest.manifest.application?.[0].$['android:supportsRtl']).toBe('true');
  });

  it('sets android:supportsRtl to "false"', () => {
    const manifest = setAndroidSupportsRtl(getManifest(), false);
    expect(manifest.manifest.application?.[0].$['android:supportsRtl']).toBe('false');
  });

  it('overwrites an existing android:supportsRtl value', () => {
    const manifest = getManifest();
    manifest.manifest.application![0].$['android:supportsRtl'] = 'true';
    setAndroidSupportsRtl(manifest, false);
    expect(manifest.manifest.application?.[0].$['android:supportsRtl']).toBe('false');
  });
});

describe('converts locales to BCP-47 format', () => {
  it('should convert simple language codes to BCP-47 format', () => {
    expect(convertBcp47ToResourceQualifier('en')).toBe('b+en');
    expect(convertBcp47ToResourceQualifier('fr')).toBe('b+fr');
    expect(convertBcp47ToResourceQualifier('de')).toBe('b+de');
    expect(convertBcp47ToResourceQualifier('es')).toBe('b+es');
    expect(convertBcp47ToResourceQualifier('ja')).toBe('b+ja');
    expect(convertBcp47ToResourceQualifier('zh')).toBe('b+zh');
  });

  it('should convert language-region codes to BCP-47 format', () => {
    expect(convertBcp47ToResourceQualifier('en-US')).toBe('b+en+US');
    expect(convertBcp47ToResourceQualifier('en-GB')).toBe('b+en+GB');
    expect(convertBcp47ToResourceQualifier('zh-Hans')).toBe('b+zh+Hans');
    expect(convertBcp47ToResourceQualifier('zh-Hant')).toBe('b+zh+Hant');
    expect(convertBcp47ToResourceQualifier('es-419')).toBe('b+es+419');
    expect(convertBcp47ToResourceQualifier('zh-Hant-TW')).toBe('b+zh+Hant+TW');
  });
});
