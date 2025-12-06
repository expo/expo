import { ExpoConfig } from '@expo/config-types';
import { AndroidConfig, IOSConfig } from 'expo/config-plugins';
const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

export const withInlineModules = (config: ExpoConfig, props: any) => {
  config = createBuildGradlePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.enabled',
        propValueGetter: (conf) => (conf.experiments?.inlineModules === true).toString(),
      },
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (conf.experiments?.inlineModules !== true) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.inlineModules?.watchedDirectories ?? []);
        },
      },
    ],
    'withAndroidInlineModules'
  )(config);

  config = createBuildPodfilePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.enabled',
        propValueGetter: (conf) => (conf.experiments?.inlineModules === true).toString(),
      },
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (conf.experiments?.inlineModules !== true) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.inlineModules?.watchedDirectories ?? []);
        },
      },
    ],
    'withIosInlineModules'
  )(config);

  return config;
};

export default withInlineModules;
