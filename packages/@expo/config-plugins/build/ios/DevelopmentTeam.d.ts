import type { ExpoConfig } from '@expo/config-types';
import { type XCBuildConfiguration } from 'xcode';
import type { ConfigPlugin, XcodeProject } from '../Plugin.types';
/**
 * Set the Apple development team ID for all build configurations using the first native target.
 */
export declare const withDevelopmentTeam: ConfigPlugin<{
    appleTeamId?: string;
} | void>;
/** Get the Apple development team ID from Expo config, if defined */
export declare function getDevelopmentTeam(config: Pick<ExpoConfig, 'ios'>): string | null;
/** Set the Apple development team ID for an XCBuildConfiguration object */
export declare function setDevelopmentTeamForBuildConfiguration(xcBuildConfiguration: XCBuildConfiguration, developmentTeam?: string): void;
/**
 * Update the Apple development team ID for all XCBuildConfiguration entries, in all native targets.
 *
 * A development team is stored as a value in XCBuildConfiguration entry.
 * Those entries exist for every pair (build target, build configuration).
 * Unless target name is passed, the first target defined in the pbxproj is used
 * (to keep compatibility with the inaccurate legacy implementation of this function).
 */
export declare function updateDevelopmentTeamForPbxproj(project: XcodeProject, appleTeamId?: string): XcodeProject;
/**
 * Updates the Apple development team ID for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {[string]} appleTeamId Desired Apple development team ID
 */
export declare function setDevelopmentTeamForPbxproj(projectRoot: string, appleTeamId?: string): void;
