const pkg = require('./package.json');
const { createRunOncePlugin, withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');
const assert = require('assert');

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

const withScreenOrientationViewController = (config, { initialOrientation = 'DEFAULT' } = {}) => {
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
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        // Add import
        if (
          !contents.includes('#import <EXScreenOrientation/EXScreenOrientationViewController.h>')
        ) {
          contents = contents.replace(
            /\#import \"AppDelegate.h\"/g,
            `#import "AppDelegate.h"
#import <EXScreenOrientation/EXScreenOrientationViewController.h>`
          );
        }

        // Change View Controller
        if (!contents.includes('[EXScreenOrientationViewController alloc]')) {
          contents = contents.replace(
            /UIViewController\s?\*\s?rootViewController\s?=\s?\[UIViewController new\]\;/g,
            `UIViewController *rootViewController = [[EXScreenOrientationViewController alloc] initWithDefaultScreenOrientationMask:${OrientationLock[initialOrientation]}];`
          );
        }
      } else {
        // TODO: Support Swift
        throw new Error(
          `Cannot append screen orientation view controller to AppDelegate of language "${fileInfo.language}"`
        );
      }
      await fs.writeFile(fileInfo.path, contents);

      return config;
    },
  ]);
};

module.exports = createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
