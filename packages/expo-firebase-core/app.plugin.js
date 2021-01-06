const pkg = require('./package.json');
const { withDangerousMod, createRunOncePlugin, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');

const methodInvocationBlock = `[FIRApp configure];`;

const withFirebaseAppDelegate = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        // Add import
        if (!contents.includes('@import Firebase;')) {
          contents = contents.replace(
            /\#import \"AppDelegate.h\"/g,
            `#import "AppDelegate.h"
@import Firebase;`
          );
        }

        // Add invocation
        if (!contents.includes(methodInvocationBlock)) {
          // self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]
          contents = contents.replace(
            /self\.moduleRegistryAdapter \= \[\[UMModuleRegistryAdapter alloc\]/g,
            `${methodInvocationBlock}
    self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]`
          );
        }
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

module.exports = createRunOncePlugin(withFirebaseAppDelegate, pkg.name, pkg.version);
