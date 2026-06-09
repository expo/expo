import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

export const withInlineModules = (config: ExpoConfig, props: any) => {
  config = createBuildGradlePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (!conf.experiments?.inlineModules) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
        },
      },
    ],
    'withAndroidInlineModules'
  )(config);

  config = createBuildPodfilePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (!conf.experiments?.inlineModules) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
        },
      },
      {
        propName: 'expo.inlineModules.xcodeProjectTargets',
        propValueGetter: (conf) => {
          const xcodeProjectTargets = conf.experiments?.inlineModules?.xcodeProjectTargets;
          if (!xcodeProjectTargets) {
            return JSON.stringify({ all: true, targets: [] });
          }
          return JSON.stringify({ all: false, targets: xcodeProjectTargets });
        },
      },
    ],
    'withIosInlineModules'
  )(config);

  return config;
};

export default withInlineModules;
