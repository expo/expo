import { ColorDescriptor } from 'color-string';
import path from 'path';

import { ResizeMode } from '../constants';
import configureAndroidManifestXML from './AndroidManifest.xml';
import configureColorsXML from './Colors.xml';
import configureDrawableXML from './Drawable.xml';
import configureDrawables from './Drawables';
import configureMainActivity from './MainActivity';
import configureStylesXML from './Styles.xml';

export default async function configureAndroid(
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
  const androidMainPath = path.resolve(projectRootPath, 'android/app/src/main');

  await Promise.all([
    configureDrawables(androidMainPath, imagePath),
    configureColorsXML(androidMainPath, backgroundColor),
    configureDrawableXML(androidMainPath, resizeMode),
    configureStylesXML(androidMainPath),
    configureAndroidManifestXML(androidMainPath),
    configureMainActivity(projectRootPath, resizeMode),
  ]);
}
