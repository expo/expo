import fs from 'fs-extra';
import path from 'path';

const SPLASH_SCREEN_FILENAME = 'splashscreen_image.png';

const DRAWABLES_CONFIGS = {
  default: {
    path: `./res/drawable/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 1,
  },
  mdpi: {
    path: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 1,
  },
  hdpi: {
    path: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 1.5,
  },
  xhdpi: {
    path: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 2,
  },
  xxhdpi: {
    path: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 3,
  },
  xxxhdpi: {
    path: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
    dimensionsMultiplier: 4,
  },
};

const DRAWABLE_DIR_PATH = './res/drawable';
const SPLASH_SCREEN_DRAWABLE_PATH = `./res/drawable/${SPLASH_SCREEN_FILENAME}`;

/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
export default async function configureDrawables(
  androidMainPath: string,
  splashScreenImagePath?: string
) {
  await Promise.all(
    Object.values(DRAWABLES_CONFIGS).map(async ({ path: drawbalePath }) => {
      if (await fs.pathExists(path.resolve(androidMainPath, drawbalePath))) {
        await fs.remove(path.resolve(androidMainPath, drawbalePath));
      }
    })
  );

  if (splashScreenImagePath) {
    if (!(await fs.pathExists(path.resolve(androidMainPath, DRAWABLE_DIR_PATH)))) {
      await fs.mkdir(path.resolve(androidMainPath, DRAWABLE_DIR_PATH));
    }
    await fs.copyFile(
      splashScreenImagePath,
      path.resolve(androidMainPath, SPLASH_SCREEN_DRAWABLE_PATH)
    );
  }
}
