import { ResourceKind } from './Resources';
export interface ProjectFile<L extends string = string> {
    path: string;
    language: L;
    contents: string;
}
export type ApplicationProjectFile = ProjectFile<'java' | 'kt'>;
export type GradleProjectFile = ProjectFile<'groovy' | 'kt'>;
export declare function getProjectFilePath(projectRoot: string, name: string): string;
export declare function getFileInfo(filePath: string): {
    path: string;
    contents: string;
    language: any;
};
export declare function getMainApplicationAsync(projectRoot: string): Promise<ApplicationProjectFile>;
export declare function getMainActivityAsync(projectRoot: string): Promise<ApplicationProjectFile>;
export declare function getGradleFilePath(projectRoot: string, gradleName: string): string;
export declare function getProjectBuildGradleFilePath(projectRoot: string): string;
export declare function getProjectBuildGradleAsync(projectRoot: string): Promise<GradleProjectFile>;
export declare function getSettingsGradleFilePath(projectRoot: string): string;
export declare function getSettingsGradleAsync(projectRoot: string): Promise<GradleProjectFile>;
export declare function getAppBuildGradleFilePath(projectRoot: string): string;
export declare function getAppBuildGradleAsync(projectRoot: string): Promise<GradleProjectFile>;
export declare function getProjectPathOrThrowAsync(projectRoot: string): Promise<string>;
export declare function getAndroidManifestAsync(projectRoot: string): Promise<string>;
export declare function getResourceFolderAsync(projectRoot: string): Promise<string>;
export declare function getResourceXMLPathAsync(projectRoot: string, { kind, name }: {
    kind?: ResourceKind;
    name: 'colors' | 'strings' | 'styles' | string;
}): Promise<string>;
