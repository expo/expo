import { ConfigPlugin, withInfoPlist, withAndroidManifest } from '@expo/config-plugins';
import { Manifest } from '@expo/config-plugins/build/android';

function enablePiPSupport(application: Manifest.ManifestApplication) {
  if (application.$['android:name'] !== '.MainApplication') {
    return;
  }

  if (!application.activity) {
    return console.error("Couldn't apply the expo-video plugin for Android");
  }

  let applied = false;
  application.activity = application.activity.map((activity) => {
    if (activity.$['android:name'] === '.MainActivity') {
      activity.$['android:supportsPictureInPicture'] = 'true';
      applied = true;
    }
    return activity;
  });

  if (!applied) {
    console.error("Couldn't apply the expo-video plugin for Android");
  }
}

const withExpoVideo: ConfigPlugin = (config) => {
  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
    if (!currentBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
    }
    return config;
  });

  withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;

    if (!manifest || !manifest.application || manifest.application.length === 0) {
      console.error("Couldn't apply the expo-video plugin for Android");
      return config;
    }

    manifest.application.forEach(enablePiPSupport);

    config.modResults.manifest = manifest;

    return config;
  });
  return config;
};

export default withExpoVideo;
