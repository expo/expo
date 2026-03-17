export interface InlineModulesXcodeParams {
    watchedDirectories: string[];
}
/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
export declare function updateXcodeProject(projectRoot: string, inlineModulesXcodeParams: InlineModulesXcodeParams): Promise<void>;
