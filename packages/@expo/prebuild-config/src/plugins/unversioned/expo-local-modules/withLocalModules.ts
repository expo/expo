import { ExpoConfig } from '@expo/config-types';
import { AndroidConfig, IOSConfig } from 'expo/config-plugins';
const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

export const withLocalModules = (config: ExpoConfig, props: any) => {
  config = createBuildGradlePropsConfigPlugin(
    [
      {
        propName: 'expo.localModules.enabled',
        propValueGetter: (conf) => (conf.experiments?.localModules === true).toString(),
      },
      {
        propName: 'expo.localModules.watchedDirs',
        propValueGetter: (conf) => {
          if (conf.experiments?.localModules !== true) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.localModules?.watchedDirs ?? []);
        },
      },
    ],
    'withAndroidLocalModules'
  )(config);

  config = createBuildPodfilePropsConfigPlugin(
    [
      {
        propName: 'expo.localModules.enabled',
        propValueGetter: (conf) => (conf.experiments?.localModules === true).toString(),
      },
      {
        propName: 'expo.localModules.watchedDirs',
        propValueGetter: (conf) => {
          if (conf.experiments?.localModules !== true) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.localModules?.watchedDirs ?? []);
        },
      },
    ],
    'withIosLocalModules'
  )(config);

  return config;
};

export default withLocalModules;
