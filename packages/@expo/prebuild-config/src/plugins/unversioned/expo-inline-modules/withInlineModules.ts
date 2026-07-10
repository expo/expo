import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

// Note that this main target name is based on how `@expo/cli/src/prebuild/renameTemplateAppNameAsync.ts` preprocesses the ios project template.
// It is neccesary to match the target name in the path to ExpoModulesProvider.swift for the main target as is used when generating it.
function getMainTargetName(config: ExpoConfig): string {
  const name = config.name;
  const safeName = escapeXMLCharacters(name);
  return IOSConfig.XcodeUtils.sanitizedName(safeName);
}

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
            return JSON.stringify({ mainTarget: getMainTargetName(config), targets: [] });
          }
          return JSON.stringify({ targets: xcodeProjectTargets });
        },
      },
    ],
    'withIosInlineModules'
  )(config);

  return config;
};

export default withInlineModules;
