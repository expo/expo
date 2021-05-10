import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs-extra';

const pkg = require('expo-firebase-core/package.json');

const methodInvocationBlock = `[FIRApp configure];`;

export function modifyObjcAppDelegate(contents: string): string {
  // Add import
  if (!contents.includes('@import Firebase;')) {
    contents = contents.replace(
      /#import "AppDelegate.h"/g,
      `#import "AppDelegate.h"
@import Firebase;`
    );
  }

  // Add invocation
  if (!contents.includes(methodInvocationBlock)) {
    // self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]
    contents = contents.replace(
      /self\.moduleRegistryAdapter = \[\[UMModuleRegistryAdapter alloc\]/g,
      `${methodInvocationBlock}
self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]`
    );
  }

  return contents;
}

const withFirebaseAppDelegate: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        contents = modifyObjcAppDelegate(contents);
      } else {
        // TODO: Support Swift
        throw new Error(
          `Cannot add Firebase code to AppDelegate of language "${fileInfo.language}"`
        );
      }
      await fs.writeFile(fileInfo.path, contents);

      return config;
    },
  ]);
};

export default createRunOncePlugin(withFirebaseAppDelegate, pkg.name, pkg.version);
