import {
  AndroidConfig,
  type ConfigPlugin,
  type InfoPlist,
  withAndroidManifest,
  withInfoPlist,
} from 'expo/config-plugins';

const SERVICE_NAME = 'expo.modules.mediasession.service.MediaPlaybackService';

export type Props = {
  /**
   * Whether to enable background playback support.
   * @default false
   */
  supportsBackgroundPlayback?: boolean;
};

export function setBackgroundModes(
  infoPlist: InfoPlist,
  { supportsBackgroundPlayback = false }: Props
): InfoPlist {
  if (!supportsBackgroundPlayback) {
    return infoPlist;
  }
  if (!Array.isArray(infoPlist.UIBackgroundModes)) {
    infoPlist.UIBackgroundModes = [];
  }
  if (!infoPlist.UIBackgroundModes.includes('audio')) {
    infoPlist.UIBackgroundModes.push('audio');
  }
  return infoPlist;
}

export function setPlaybackService(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  { supportsBackgroundPlayback = false }: Props
): AndroidConfig.Manifest.AndroidManifest {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  application.service ??= [];
  let service = application.service.find((it) => it.$['android:name'] === SERVICE_NAME);
  if (!service) {
    service = { $: { 'android:name': SERVICE_NAME, 'android:exported': 'false' } };
    application.service.push(service);
  }
  service.$['android:exported'] ??= 'false';
  if (supportsBackgroundPlayback) {
    const types = service.$['android:foregroundServiceType']?.split('|') ?? [];
    if (!types.includes('mediaPlayback')) {
      service.$['android:foregroundServiceType'] = [...types, 'mediaPlayback'].join('|');
    }
    AndroidConfig.Permissions.ensurePermissions(androidManifest, [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ]);
  }
  return androidManifest;
}

export const withMediaSession: ConfigPlugin<Props | void> = (config, props) => {
  config = withInfoPlist(config, (config) => {
    config.modResults = setBackgroundModes(config.modResults, props ?? {});
    return config;
  });
  return withAndroidManifest(config, (config) => {
    config.modResults = setPlaybackService(config.modResults, props ?? {});
    return config;
  });
};

export default withMediaSession;
