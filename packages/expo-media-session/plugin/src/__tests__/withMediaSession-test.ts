import { AndroidConfig, type InfoPlist } from 'expo/config-plugins';

import { setBackgroundModes, setPlaybackService } from '../withMediaSession';

const SERVICE = 'expo.modules.mediasession.service.MediaPlaybackService';
const FGS = 'android.permission.FOREGROUND_SERVICE';
const FGS_MEDIA = 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';

function manifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  };
}

function services(androidManifest: AndroidConfig.Manifest.AndroidManifest) {
  return (AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest).service ?? []).filter(
    (service) => service.$['android:name'] === SERVICE
  );
}

describe('setBackgroundModes', () => {
  it('addsBackgroundModeWhenEnabled', () => {
    expect(setBackgroundModes({}, { supportsBackgroundPlayback: true }).UIBackgroundModes).toEqual([
      'audio',
    ]);
  });

  it('doesNotAddBackgroundModeByDefault', () => {
    expect(setBackgroundModes({}, {}).UIBackgroundModes).toBeUndefined();
  });

  it('neverRemovesExistingAudioBackgroundMode', () => {
    const infoPlist: InfoPlist = { UIBackgroundModes: ['audio', 'fetch'] };
    expect(
      setBackgroundModes(infoPlist, { supportsBackgroundPlayback: false }).UIBackgroundModes
    ).toEqual(['audio', 'fetch']);
  });

  it('replacesNonArrayBackgroundModes', () => {
    const infoPlist = { UIBackgroundModes: 'audio' } as unknown as InfoPlist;
    expect(
      setBackgroundModes(infoPlist, { supportsBackgroundPlayback: true }).UIBackgroundModes
    ).toEqual(['audio']);
  });
});

describe('setPlaybackService', () => {
  it('addsServiceWithoutPostNotifications', () => {
    const result = setPlaybackService(manifest(), {});
    expect(services(result)).toEqual([
      { $: { 'android:name': SERVICE, 'android:exported': 'false' } },
    ]);
    expect(AndroidConfig.Permissions.getPermissions(result)).not.toContain(
      'android.permission.POST_NOTIFICATIONS'
    );
  });

  it('fgsPermissionsOnlyWhenBackgroundEnabled', () => {
    expect(AndroidConfig.Permissions.getPermissions(setPlaybackService(manifest(), {}))).toEqual(
      []
    );

    const enabled = setPlaybackService(manifest(), { supportsBackgroundPlayback: true });
    expect(AndroidConfig.Permissions.getPermissions(enabled)).toEqual([FGS, FGS_MEDIA]);
    expect(services(enabled)).toEqual([
      {
        $: {
          'android:name': SERVICE,
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
        },
      },
    ]);
  });

  it('addsForegroundServiceTypeToExistingService', () => {
    const result = setPlaybackService(setPlaybackService(manifest(), {}), {
      supportsBackgroundPlayback: true,
    });
    expect(services(result)).toHaveLength(1);
    expect(services(result)[0]?.$['android:foregroundServiceType']).toBe('mediaPlayback');
  });

  it('mergesForegroundServiceTypeWithExistingType', () => {
    const androidManifest = manifest();
    AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest).service = [
      { $: { 'android:name': SERVICE, 'android:foregroundServiceType': 'dataSync' } },
    ];
    const result = setPlaybackService(androidManifest, { supportsBackgroundPlayback: true });
    expect(services(result)[0]?.$['android:foregroundServiceType']).toBe('dataSync|mediaPlayback');
  });

  it('keepsExportedOnExistingServiceAndAddsItWhenMissing', () => {
    const exported = manifest();
    AndroidConfig.Manifest.getMainApplicationOrThrow(exported).service = [
      { $: { 'android:name': SERVICE, 'android:exported': 'true' } },
    ];
    expect(services(setPlaybackService(exported, {}))[0]?.$['android:exported']).toBe('true');

    const missing = manifest();
    AndroidConfig.Manifest.getMainApplicationOrThrow(missing).service = [
      { $: { 'android:name': SERVICE } },
    ];
    expect(services(setPlaybackService(missing, {}))[0]?.$['android:exported']).toBe('false');
  });

  it('neverStripsForegroundServiceTypeOrPermissions', () => {
    const result = setPlaybackService(
      setPlaybackService(manifest(), { supportsBackgroundPlayback: true }),
      { supportsBackgroundPlayback: false }
    );
    expect(services(result)[0]?.$['android:foregroundServiceType']).toBe('mediaPlayback');
    expect(AndroidConfig.Permissions.getPermissions(result)).toEqual([FGS, FGS_MEDIA]);
  });
});

it('isIdempotent', () => {
  const props = { supportsBackgroundPlayback: true };
  const infoPlist = setBackgroundModes(setBackgroundModes({}, props), props);
  expect(infoPlist.UIBackgroundModes).toEqual(['audio']);

  const result = setPlaybackService(setPlaybackService(manifest(), props), props);
  expect(services(result)).toHaveLength(1);
  expect(AndroidConfig.Permissions.getPermissions(result)).toEqual([FGS, FGS_MEDIA]);
});
