import fs from 'fs-extra';
import path from 'path';

const SPLASH_SCREEN_FILENAME = 'splashscreen.png';

const FILES_PATHS = {
  IMAGESET: 'Images.xcassets/SplashScreen.imageset',
  IMAGESET_CONTENTS: 'Images.xcassets/SplashScreen.imageset/Contents.json',
  PNG: `Images.xcassets/SplashScreen.imageset/${SPLASH_SCREEN_FILENAME}`,
};

/**
 * Creates [IMAGESET] containing image for Splash/Launch Screen.
 */
export default async function configureAssets(iosProjectPath: string, imagePath?: string) {
  const imageSetPath = path.resolve(iosProjectPath, FILES_PATHS.IMAGESET);

  // ensure old SplashScreen imageSet is removed
  if (await fs.pathExists(imageSetPath)) {
    await fs.remove(imageSetPath);
  }

  if (imagePath) {
    await fs.mkdirp(imageSetPath);
    const contentJson = {
      images: [
        {
          idiom: 'universal',
          filename: SPLASH_SCREEN_FILENAME,
          scale: '1x',
        },
        {
          idiom: 'universal',
          scale: '2x',
        },
        {
          idiom: 'universal',
          scale: '3x',
        },
      ],
      info: {
        version: 1,
        author: 'xcode',
      },
    };

    await fs.writeFile(
      path.resolve(iosProjectPath, FILES_PATHS.IMAGESET_CONTENTS),
      JSON.stringify(contentJson, null, 2)
    );

    await fs.copyFile(imagePath, path.resolve(iosProjectPath, FILES_PATHS.PNG));
  }
}
