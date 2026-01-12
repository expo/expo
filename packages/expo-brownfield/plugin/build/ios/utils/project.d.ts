import type { XcodeProject } from 'expo/config-plugins';
import type { Group, PbxGroup, Target } from '../types';
export declare const createFramework: (project: XcodeProject, targetName: string, bundleIdentifier: string) => Target;
export declare const getGroupByUUID: (project: XcodeProject, uuid: string) => PbxGroup;
export declare const createGroup: (project: XcodeProject, name: string, path: string, files?: string[]) => Group;
export declare const configureBuildPhases: (project: XcodeProject, target: Target, targetName: string, projectName: string, files?: string[]) => void;
export declare const configureBuildSettings: (project: XcodeProject, targetName: string, currentProjectVersion: string, bundleIdentifier: string) => void;
export declare const inferProjectName: (platformProjectRoot: string) => string;
