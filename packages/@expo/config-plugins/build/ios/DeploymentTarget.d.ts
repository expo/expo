import type { ExpoConfig } from '@expo/config-types';
import type { XCBuildConfiguration } from 'xcode';
import type { ConfigPlugin, XcodeProject } from '../Plugin.types';
/**
 * Set the iOS deployment target for all build configurations in the main application target.
 */
export declare const withDeploymentTarget: ConfigPlugin;
/**
 * A config-plugin to update `ios/Podfile.properties.json` with the deployment target
 */
export declare const withDeploymentTargetPodfileProps: ConfigPlugin<void>;
/** Get the iOS deployment target from Expo config, if defined */
export declare function getDeploymentTarget(config: Pick<ExpoConfig, 'ios'>): string | null;
/** Set the iOS deployment target for an XCBuildConfiguration object */
export declare function setDeploymentTargetForBuildConfiguration(xcBuildConfiguration: XCBuildConfiguration, deploymentTarget?: string): void;
/**
 * Update the iOS deployment target for all XCBuildConfiguration entries in the main application target.
 */
export declare function updateDeploymentTargetForPbxproj(project: XcodeProject, deploymentTarget: string): XcodeProject;
