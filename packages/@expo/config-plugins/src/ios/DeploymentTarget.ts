import type { ExpoConfig } from '@expo/config-types';
import type { XCBuildConfiguration } from 'xcode';

import { createBuildPodfilePropsConfigPlugin } from './BuildProperties';
import { getNativeTargets } from './Target';
import type { ConfigPlugin, XcodeProject } from '../Plugin.types';
import { withXcodeProject } from '../plugins/ios-plugins';
import { getBuildConfigurationsForListId } from './utils/Xcodeproj';

/**
 * Set the iOS deployment target for all build configurations using all native targets.
 */
export const withDeploymentTarget: ConfigPlugin = (config) => {
  return withXcodeProject(config, (config) => {
    const deploymentTarget = getDeploymentTarget(config);
    if (deploymentTarget) {
      config.modResults = updateDeploymentTargetForPbxproj(config.modResults, deploymentTarget);
    }
    return config;
  });
};

/**
 * A config-plugin to update `ios/Podfile.properties.json` with the deployment target
 */
export const withDeploymentTargetPodfileProps = createBuildPodfilePropsConfigPlugin<ExpoConfig>(
  [
    {
      propName: 'ios.deploymentTarget',
      propValueGetter: (config) => config.ios?.deploymentTarget ?? null,
    },
  ],
  'withDeploymentTargetPodfileProps'
);

/** Get the iOS deployment target from Expo config, if defined */
export function getDeploymentTarget(config: Pick<ExpoConfig, 'ios'>): string | null {
  return config.ios?.deploymentTarget ?? null;
}

/** Set the iOS deployment target for an XCBuildConfiguration object */
export function setDeploymentTargetForBuildConfiguration(
  xcBuildConfiguration: XCBuildConfiguration,
  deploymentTarget?: string
): void {
  if (deploymentTarget) {
    xcBuildConfiguration.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
  }
}

/**
 * Update the iOS deployment target for all XCBuildConfiguration entries, in all native targets.
 */
export function updateDeploymentTargetForPbxproj(
  project: XcodeProject,
  deploymentTarget: string
): XcodeProject {
  const nativeTargets = getNativeTargets(project);

  nativeTargets.forEach(([, nativeTarget]) => {
    getBuildConfigurationsForListId(project, nativeTarget.buildConfigurationList).forEach(
      ([, buildConfig]) => setDeploymentTargetForBuildConfiguration(buildConfig, deploymentTarget)
    );
  });

  return project;
}
