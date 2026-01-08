import Server from '@expo/metro/metro/Server';
export interface ModuleGenerationArguments {
    projectRoot: string;
    metro: Server | null;
}
export declare function isValidInlineModuleFileName(fileName: string): boolean;
export declare function trimExtension(fileName: string): string;
export declare function getProjectExcludePathsGlobs(projectRoot: string): string[];
export declare function isFilePathExcluded(filePath: string, excludePathsGlobs: string[]): boolean;
export declare function getMirrorDirectoriesPaths(dotExpoDir: string): {
    inlineModulesModulesPath: string;
    inlineModulesTypesPath: string;
};
export declare function findUpPackageJsonDirectoryCached(cwd: string, directoryToPackage: Map<string, string>): string | undefined;
export declare function createFreshMirrorDirectories(dotExpoDir: string): Promise<void>;
export declare function typesAndModulePathsForFile(dotExpoDir: string, watchedDirRootAbsolutePath: string, absoluteFilePath: string, directoryToPackage: Map<string, string>): {
    moduleTypesFilePath: string;
    viewTypesFilePath: string;
    viewExportPath: string;
    moduleExportPath: string;
    moduleName: string;
};
export declare function generateMirrorDirectories(projectRoot: string, filesWatched?: Set<string>, directoryToPackage?: Map<string, string>): Promise<void>;
export declare function startInlineModulesMetroWatcherAsync({ projectRoot, metro }: ModuleGenerationArguments, filesWatched?: Set<string>, directoryToPackage?: Map<string, string>): Promise<void>;
