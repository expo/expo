import { XcodeProject } from '@expo/config-plugins';
type conflictingExtensionResult = 'doesnt-exist' | 'exists' | 'exists-conflicting';
export declare function conflictingExtensionExists(xcodeProject: XcodeProject, targetName: string, bundleIdentifier: string): conflictingExtensionResult;
export {};
