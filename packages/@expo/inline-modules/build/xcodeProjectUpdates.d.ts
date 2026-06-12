export interface InlineModulesXcodeParams {
    watchedDirectories: string[];
    /**
     * List of targets to which inline modules files are added. If undefined defaults to the main target only.
     */
    xcodeProjectTargets?: string[];
    /** app config name */
    name: string;
}
/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
export declare function updateXcodeProject(projectRoot: string, inlineModulesXcodeParams: InlineModulesXcodeParams): Promise<void>;
