/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relative path to package's changelog. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
export declare function getPackageChangelogRelativePath(packageName: string): string;
export declare function getExpoRepositoryRootDir(): string;
export declare function getFileContentAsync(path: string): Promise<string>;
