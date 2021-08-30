import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withDangerousMod,
} from '@expo/config-plugins';
import assert from 'assert';
import fs from 'fs';

const pkg = require('expo-screen-orientation/package.json');

const OrientationLock = {
  DEFAULT: 'UIInterfaceOrientationMaskAllButUpsideDown',
  ALL: 'UIInterfaceOrientationMaskAll',
  PORTRAIT: 'UIInterfaceOrientationMaskPortrait',
  PORTRAIT_UP: 'UIInterfaceOrientationMaskPortrait',
  PORTRAIT_DOWN: 'UIInterfaceOrientationMaskPortraitUpsideDown',
  LANDSCAPE: 'UIInterfaceOrientationMaskLandscape',
  LANDSCAPE_LEFT: 'UIInterfaceOrientationMaskLandscapeLeft',
  LANDSCAPE_RIGHT: 'UIInterfaceOrientationMaskLandscapeRight',
};

export function modifyObjcAppDelegate(contents: string, mask: string): string {
  // Add import
  if (!contents.includes('#import <EXScreenOrientation/EXScreenOrientationViewController.h>')) {
    contents = contents.replace(
      /#import "AppDelegate.h"/g,
      `#import "AppDelegate.h"
#import <EXScreenOrientation/EXScreenOrientationViewController.h>`
    );
  }

  // Change View Controller
  if (!contents.includes('[EXScreenOrientationViewController alloc]')) {
    contents = contents.replace(
      /UIViewController\s?\*\s?rootViewController\s?=\s?\[UIViewController new\];/g,
      `UIViewController *rootViewController = [[EXScreenOrientationViewController alloc] initWithDefaultScreenOrientationMask:${mask}];`
    );
  }
  return contents;
}

const withScreenOrientationViewController: ConfigPlugin<{
  initialOrientation?: keyof typeof OrientationLock;
} | void> = (config, { initialOrientation = 'DEFAULT' } = {}) => {
  assert(
    initialOrientation in OrientationLock,
    `Invalid initial orientation "${initialOrientation}" expected one of: ${Object.keys(
      OrientationLock
    ).join(', ')}`
  );

  return withDangerousMod(config, [
    'ios',
    async config => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = fs.readFileSync(fileInfo.path, { encoding: 'utf-8' });
      if (fileInfo.language === 'objc') {
        contents = modifyObjcAppDelegate(contents, OrientationLock[initialOrientation]);
      } else {
        // TODO: Support Swift
        throw new Error(
          `Cannot append screen orientation view controller to AppDelegate of language "${fileInfo.language}"`
        );
      }
      fs.writeFileSync(fileInfo.path, contents);

      return config;
    },
  ]);
};

export default createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
