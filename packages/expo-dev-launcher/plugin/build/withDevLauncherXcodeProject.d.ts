import { ConfigPlugin } from '@expo/config-plugins';
declare type XcodeProject = any;
export declare function modifyReactNativeBuildPhase(projectRoot: string, project: XcodeProject): XcodeProject;
export declare const withDevLauncherXcodeProject: ConfigPlugin;
export {};
