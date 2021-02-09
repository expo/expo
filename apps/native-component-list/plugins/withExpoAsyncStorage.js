const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');

const withExpoAsyncStorage = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        // Add DevMenu imports
        if (!contents.includes('#import <React/RCTAsyncLocalStorage.h>')) {
          contents = contents.replace(
            /#import "AppDelegate.h"/g,
            `#import "AppDelegate.h"
#import <React/RCTAsyncLocalStorage.h>`
          );
        }

        // Make the extraModules mutable
        const modulesRegex = /NSArray<id<RCTBridgeModule>>\s?\*extraModules\s?=\s?\[_moduleRegistryAdapter extraModulesForBridge:bridge\];/;
        if (contents.match(modulesRegex)) {
          contents = contents.replace(
            modulesRegex,
            'NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray arrayWithArray:[_moduleRegistryAdapter extraModulesForBridge:bridge]];'
          );
        }

        // Add AsyncStorage back
        if (
          !contents.includes(
            '[extraModules addObject:[[RCTAsyncLocalStorage alloc] initWithStorageDirectory:[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject] stringByAppendingPathComponent:@"RCTAsyncLocalStorage_V1"]]];'
          )
        ) {
          contents = contents.replace(
            /return extraModules;/g,
            `[extraModules addObject:[[RCTAsyncLocalStorage alloc] initWithStorageDirectory:[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject] stringByAppendingPathComponent:@"RCTAsyncLocalStorage_V1"]]];
  return extraModules;`
          );
        }
      } else {
        throw new Error(
          `Cannot append DevMenu module to AppDelegate of language "${fileInfo.language}"`
        );
      }
      await fs.writeFile(fileInfo.path, contents);

      return config;
    },
  ]);
};

module.exports = withExpoAsyncStorage;
