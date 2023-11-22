import { ConfigPlugin } from '@expo/config-plugins';
import { XCParseXcodeProject } from './withXCParseXcodeProject';
declare type IosDeploymentTargetConfigPlugin = ConfigPlugin<{
    deploymentTarget: string;
}>;
export declare const withIosDeploymentTarget: IosDeploymentTargetConfigPlugin;
export declare function updateDeploymentTargetPodfile(projectRoot: string, contents: string, deploymentTarget: string): Promise<string>;
export declare function shouldUpdateDeployTargetPodfileAsync(projectRoot: string, targetVersion: string): Promise<boolean>;
export declare function lookupReactNativeMinIosVersionSupported(projectRoot: string): Promise<string | null>;
export declare function updateDeploymentTargetXcodeProject(project: XCParseXcodeProject, deploymentTarget: string): XCParseXcodeProject;
export {};
