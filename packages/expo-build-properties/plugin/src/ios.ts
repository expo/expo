import { IOSConfig, ConfigPlugin, withXcodeProject, XcodeProject } from '@expo/config-plugins';

import type { PluginConfigType } from './pluginConfig';

const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

export const withIosBuildProperties = createBuildPodfilePropsConfigPlugin<PluginConfigType>(
  [
    {
      propName: 'ios.useFrameworks',
      propValueGetter: (config) => config.ios?.useFrameworks,
    },
  ],
  'withIosBuildProperties'
);

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
  const configurations: Record<string, any> = project.pbxXCBuildConfigurationSection();
  for (const { buildSettings } of Object.values(configurations ?? {})) {
    if (buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
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
