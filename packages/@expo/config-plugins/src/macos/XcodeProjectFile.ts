import * as AppleImpl from '../apple/XcodeProjectFile';

/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `macos/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
export const withBuildSourceFile = AppleImpl.withBuildSourceFile('macos');

/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/macos` or `user/app/macos`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/macos/myapp/foobar.swift` or `user/app/macos/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
export const createBuildSourceFile = AppleImpl.createBuildSourceFile('macos');
