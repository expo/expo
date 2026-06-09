export interface InlineModulesXcodeParams {
    watchedDirectories: string[];
    /**
     * List of targets to which add watchedDirectories. If undefined default to all targets.
     */
    xcodeProjectTargets?: string[];
}
/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
export declare function updateXcodeProject(projectRoot: string, inlineModulesXcodeParams: InlineModulesXcodeParams): Promise<void>;
