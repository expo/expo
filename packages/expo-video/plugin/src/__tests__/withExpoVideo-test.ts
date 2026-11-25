import { type AndroidConfig, type ExportedConfig } from 'expo/config-plugins';

import withExpoVideo, { type WithExpoVideoOptions } from '../withExpoVideo';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
type ManifestService = NonNullable<AndroidConfig.Manifest.ManifestApplication['service']>[number];

const VIDEO_SERVICE = 'expo.modules.video.playbackService.ExpoVideoPlaybackService';
const SESSION_SERVICE = 'expo.modules.mediasession.service.MediaPlaybackService';

async function evalInfoPlistModAsync(
  options: WithExpoVideoOptions,
  modResults: Record<string, any>
): Promise<Record<string, any>> {
  const config: ExportedConfig = withExpoVideo({ name: 'test', slug: 'test' }, options);
  const mod = config.mods?.ios?.infoPlist;
  if (!mod) {
    throw new Error('Expected the mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/ios',
      modName: 'test',
      platform: 'ios',
      introspect: true,
    },
    modRawConfig: config,
  });
  return result.modResults;
}

function createManifest(services?: ManifestService[]): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [{ $: { 'android:name': '.MainActivity' } }],
          ...(services ? { service: services } : {}),
        },
      ],
    },
  };
}

async function evalAndroidManifestModAsync(
  options: WithExpoVideoOptions,
  modResults: AndroidManifest
): Promise<AndroidManifest> {
  const config: ExportedConfig = withExpoVideo({ name: 'test', slug: 'test' }, options);
  const mod = config.mods?.android?.manifest;
  if (!mod) {
    throw new Error('Expected the mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/android',
      modName: 'test',
      platform: 'android',
      introspect: true,
    },
    modRawConfig: config,
  });
  return result.modResults;
}

function getServices(manifest: AndroidManifest, name: string): ManifestService[] {
  const services = manifest.manifest.application?.[0]?.service ?? [];
  return services.filter((service) => service.$['android:name'] === name);
}

describe(withExpoVideo, () => {
  it('keeps the audio background mode added by another plugin when both options are false', async () => {
    const infoPlist = await evalInfoPlistModAsync(
      { supportsBackgroundPlayback: false, supportsPictureInPicture: false },
      { UIBackgroundModes: ['audio'] }
    );
    expect(infoPlist.UIBackgroundModes).toEqual(['audio']);
  });

  it('adds the media session service with the mediaPlayback type for background playback', async () => {
    const manifest = await evalAndroidManifestModAsync(
      { supportsBackgroundPlayback: true },
      createManifest()
    );
    const services = getServices(manifest, SESSION_SERVICE);
    expect(services).toHaveLength(1);
    expect(services[0]?.$['android:foregroundServiceType']?.split('|')).toContain('mediaPlayback');
    expect(services[0]?.$['android:exported']).toBe('false');
  });

  it('does not add the expo-video playback service', async () => {
    const manifest = await evalAndroidManifestModAsync(
      { supportsBackgroundPlayback: true },
      createManifest()
    );
    expect(getServices(manifest, VIDEO_SERVICE)).toHaveLength(0);
  });

  it('removes an expo-video playback service left by an earlier prebuild', async () => {
    const manifest = await evalAndroidManifestModAsync(
      {},
      createManifest([
        {
          $: {
            'android:name': VIDEO_SERVICE,
            'android:exported': 'false',
            'android:foregroundServiceType': 'mediaPlayback',
          },
        },
      ])
    );
    expect(getServices(manifest, VIDEO_SERVICE)).toHaveLength(0);
  });

  it('adds the media session service once when the mod runs twice', async () => {
    const first = await evalAndroidManifestModAsync(
      { supportsBackgroundPlayback: true },
      createManifest()
    );
    const second = await evalAndroidManifestModAsync({ supportsBackgroundPlayback: true }, first);
    const services = getServices(second, SESSION_SERVICE);
    expect(services).toHaveLength(1);
    expect(services[0]?.$['android:foregroundServiceType']).toBe('mediaPlayback');
  });
});
