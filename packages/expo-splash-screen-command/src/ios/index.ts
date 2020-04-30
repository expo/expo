import { ColorDescriptor } from 'color-string';
import fs from 'fs-extra';

import { ResizeMode } from '../constants';
import configureAssets from './Assets';
import configureInfoPlist from './Info.plist';
import configureStoryboard from './Storyboard';
import readPbxProject from './pbxproj';

export default async function configureIos(
  projectRootPath: string,
  {
    imagePath,
    resizeMode,
    backgroundColor,
  }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: ColorDescriptor;
  }
) {
  const iosProject = await readPbxProject(projectRootPath);

  await Promise.all([
    configureInfoPlist(iosProject.projectPath),
    configureAssets(iosProject.projectPath, imagePath),
    configureStoryboard(iosProject, {
      resizeMode,
      backgroundColor,
      splashScreenImagePresent: !!imagePath,
    }),
  ]);

  await fs.writeFile(iosProject.pbxProject.filepath, iosProject.pbxProject.writeSync());
}
