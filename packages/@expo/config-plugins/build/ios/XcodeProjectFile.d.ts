/// <reference types="xcode" />
import { ConfigPlugin, XcodeProject } from '../Plugin.types';
/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `ios/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
export declare const withBuildSourceFile: ConfigPlugin<{
    filePath: string;
    contents: string;
    overwrite?: boolean;
}>;
/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
export declare function createBuildSourceFile({ project, nativeProjectRoot, filePath, fileContents, overwrite, }: {
    project: XcodeProject;
    nativeProjectRoot: string;
    filePath: string;
    fileContents: string;
    overwrite?: boolean;
}): XcodeProject;
