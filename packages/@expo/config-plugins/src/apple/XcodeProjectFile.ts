import fs from 'fs';
import path from 'path';

import { addBuildSourceFileToGroup, getProjectName } from './utils/Xcodeproj';
import { ConfigPlugin, XcodeProject } from '../Plugin.types';
import { withXcodeProject } from '../plugins/apple-plugins';

/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `ios/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
export const withBuildSourceFile: (applePlatform: 'ios' | 'macos') => ConfigPlugin<{
  filePath: string;
  contents: string;
  overwrite?: boolean;
}> =
  (applePlatform: 'ios' | 'macos') =>
  (config, { filePath, contents, overwrite }) => {
    return withXcodeProject(applePlatform)(config, (config) => {
      const projectName = getProjectName(applePlatform)(config.modRequest.projectRoot);

      config.modResults = createBuildSourceFile(applePlatform)({
        project: config.modResults,
        nativeProjectRoot: config.modRequest.platformProjectRoot,
        fileContents: contents,
        filePath: path.join(projectName, filePath),
        overwrite,
      });
      return config;
    });
  };

/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios` or `user/app/macos`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift` or `user/app/macos/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
export const createBuildSourceFile =
  (applePlatform: 'ios' | 'macos') =>
  ({
    project,
    nativeProjectRoot,
    filePath,
    fileContents,
    overwrite,
  }: {
    project: XcodeProject;
    nativeProjectRoot: string;
    filePath: string;
    fileContents: string;
    overwrite?: boolean;
  }): XcodeProject => {
    const absoluteFilePath = path.join(nativeProjectRoot, filePath);
    if (overwrite || !fs.existsSync(absoluteFilePath)) {
      // Create the file
      fs.writeFileSync(absoluteFilePath, fileContents, 'utf8');
    }

    // `myapp`
    const groupName = path.dirname(filePath);

    // Ensure the file is linked with Xcode resource files
    if (!project.hasFile(filePath)) {
      project = addBuildSourceFileToGroup(applePlatform)({
        filepath: filePath,
        groupName,
        project,
      });
    }
    return project;
  };
