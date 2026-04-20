import {
  ConfigPlugin,
  IOSConfig,
  XcodeProject,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { PluginConfigType, resolveConfigValue } from './pluginConfig';

const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

export const withIosBuildProperties = createBuildPodfilePropsConfigPlugin<PluginConfigType>(
  [
    {
      propName: 'ios.useFrameworks',
      propValueGetter: (config) => config.ios?.useFrameworks,
    },
    {
      propName: 'ios.forceStaticLinking',
      propValueGetter: (config) => JSON.stringify(config.ios?.forceStaticLinking ?? []),
    },
    {
      propName: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
      propValueGetter: (config) => (config.ios?.networkInspector ?? true).toString(),
    },
    {
      propName: 'apple.extraPods',
      propValueGetter: (config) => {
        const extraPods = config.ios?.extraPods ?? [];
        return extraPods.length > 0 ? JSON.stringify(extraPods) : undefined;
      },
    },
    {
      propName: 'apple.ccacheEnabled',
      propValueGetter: (config) => config.ios?.ccacheEnabled?.toString(),
    },
    {
      propName: 'apple.privacyManifestAggregationEnabled',
      propValueGetter: (config) =>
        (config.ios?.privacyManifestAggregationEnabled ?? true).toString(),
    },
    {
      propName: 'ios.buildReactNativeFromSource',
      propValueGetter: (config) =>
        resolveConfigValue(config, 'ios', 'buildReactNativeFromSource')?.toString(),
    },
    {
      propName: 'expo.useHermesV1',
      propValueGetter: (config) => resolveConfigValue(config, 'ios', 'useHermesV1')?.toString(),
    },
    {
      propName: 'EXPO_USE_PRECOMPILED_MODULES',
      propValueGetter: (config) => (config.ios?.usePrecompiledModules ?? false).toString(),
    },
  ],
  'withIosBuildProperties'
);

/** @deprecated use built-in `ios.deploymentTarget` property instead. */
export const withIosDeploymentTarget: ConfigPlugin<PluginConfigType> = (config, props) => {
  const deploymentTarget = props.ios?.deploymentTarget;
  if (!deploymentTarget) {
    return config;
  }

  // Updates deployment target in app xcodeproj
  config = withIosDeploymentTargetXcodeProject(config, { deploymentTarget });

  // Updates deployement target in Podfile (Pods project)
  config = withIosDeploymentTargetPodfile(config, props);

  return config;
};

export const withIosInfoPlist: ConfigPlugin<PluginConfigType> = (config, props) => {
  const reactNativeReleaseLevel = resolveConfigValue(props, 'ios', 'reactNativeReleaseLevel');
  if (reactNativeReleaseLevel) {
    config = withIosReactNativeReleaseLevel(config, { reactNativeReleaseLevel });
  }

  return config;
};

const FMT_CONSTEVAL_FIX_MARKER = 'FMT_USE_CONSTEVAL=0';
const FMT_CONSTEVAL_FIX_SNIPPET = `
    # Fix fmt consteval compilation errors with Apple Clang in Xcode 26+
    installer.pods_project.targets.select { |t| t.name == 'fmt' }.each do |t|
      t.build_configurations.each do |c|
        flags = c.build_settings['OTHER_CPLUSPLUSFLAGS'] || '$(inherited)'
        unless flags.include?('FMT_USE_CONSTEVAL')
          c.build_settings['OTHER_CPLUSPLUSFLAGS'] = "\#{flags} -DFMT_USE_CONSTEVAL=0"
        end
      end
    end`;

export function addFmtConstevalFix(podfile: string): string {
  if (podfile.includes(FMT_CONSTEVAL_FIX_MARKER)) {
    return podfile;
  }
  const lines = podfile.split('\n');
  const postInstallIndex = lines.findIndex((line) =>
    line.includes('post_install do |installer|')
  );
  if (postInstallIndex === -1) {
    return podfile;
  }
  const insertBefore = lines.findIndex(
    (line, index) => line.trim() === 'end' && index > postInstallIndex
  );
  if (insertBefore === -1) {
    return podfile;
  }
  lines.splice(insertBefore, 0, FMT_CONSTEVAL_FIX_SNIPPET);
  return lines.join('\n');
}

export const withIosFmtConsteval: ConfigPlugin<PluginConfigType> = (config, props) => {
  if (!resolveConfigValue(props, 'ios', 'buildReactNativeFromSource')) {
    return config;
  }
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        return config;
      }
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      fs.writeFileSync(podfilePath, addFmtConstevalFix(podfile), 'utf8');
      return config;
    },
  ]);
};

const withIosReactNativeReleaseLevel: ConfigPlugin<{
  reactNativeReleaseLevel: 'stable' | 'canary' | 'experimental';
}> = (config, { reactNativeReleaseLevel }) => {
  return withInfoPlist(config, (config) => {
    config.modResults['ReactNativeReleaseLevel'] = reactNativeReleaseLevel;
    return config;
  });
};

const withIosDeploymentTargetXcodeProject: ConfigPlugin<{ deploymentTarget: string }> = (
  config,
  props
) => {
  return withXcodeProject(config, (config) => {
    config.modResults = updateDeploymentTargetXcodeProject(
      config.modResults,
      props.deploymentTarget
    );
    return config;
  });
};

function updateDeploymentTargetXcodeProject(
  project: XcodeProject,
  deploymentTarget: string
): XcodeProject {
  const { Target } = IOSConfig;
  const targetBuildConfigListIds = Target.getNativeTargets(project)
    .filter(([_, target]) => Target.isTargetOfType(target, Target.TargetType.APPLICATION))
    .map(([_, target]) => target.buildConfigurationList);

  for (const buildConfigListId of targetBuildConfigListIds) {
    for (const [, configurations] of IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      buildConfigListId
    )) {
      const { buildSettings } = configurations;
      if (buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      }
    }
  }
  return project;
}

const withIosDeploymentTargetPodfile = createBuildPodfilePropsConfigPlugin<PluginConfigType>(
  [
    {
      propName: 'ios.deploymentTarget',
      propValueGetter: (config) => config.ios?.deploymentTarget,
    },
  ],
  'withIosDeploymentTargetPodfile'
);
