import fs from 'fs';
import path from 'path';

import { ConfigPlugin, XcodeProject } from '../Plugin.types';
import { withXcodeProject } from '../plugins/ios-plugins';
import { addBuildSourceFileToGroup, getProjectName } from './utils/Xcodeproj';

/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `ios/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
export const withBuildSourceFile: ConfigPlugin<{
  filePath: string;
  contents: string;
  overwrite?: boolean;
}> = (config, { filePath, contents, overwrite }) => {
  return withXcodeProject(config, config => {
    const projectName = getProjectName(config.modRequest.projectRoot);

    config.modResults = createBuildSourceFile({
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
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
export function createBuildSourceFile({
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
}): XcodeProject {
  const absoluteFilePath = path.join(nativeProjectRoot, filePath);
  if (overwrite || !fs.existsSync(absoluteFilePath)) {
    // Create the file
    fs.writeFileSync(absoluteFilePath, fileContents, 'utf8');
  }

  // `myapp`
  const groupName = path.dirname(filePath);

  // Ensure the file is linked with Xcode resource files
  if (!project.hasFile(filePath)) {
    project = addBuildSourceFileToGroup({
      filepath: filePath,
      groupName,
      project,
    });
  }
  return project;
}
