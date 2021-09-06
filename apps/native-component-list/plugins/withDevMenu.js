const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');

const withDevMenu = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        // Add DevMenu imports
        if (!contents.includes('#import <React/RCTDevMenu.h>')) {
          contents = contents.replace(
            /#import "AppDelegate.h"/g,
            `#import "AppDelegate.h"
#import <React/RCTDevMenu.h>`
          );
        }
        if (!contents.includes('#import <React/RCTUtils.h>')) {
          contents = contents.replace(
            /#import "AppDelegate.h"/g,
            `#import "AppDelegate.h"
#import <React/RCTUtils.h>`
          );
        }

        // Make the extraModules mutable
        const modulesRegex =
          /NSArray<id<RCTBridgeModule>>\s?\*extraModules\s?=\s?\[_moduleRegistryAdapter extraModulesForBridge:bridge\];/;
        if (contents.match(modulesRegex)) {
          contents = contents.replace(
            modulesRegex,
            'NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray arrayWithArray:[_moduleRegistryAdapter extraModulesForBridge:bridge]];'
          );
        }

        // Add DevMenu back
        if (
          !contents.includes(
            '[extraModules addObject:(id<RCTBridgeModule>)[[RCTDevMenu alloc] init]];'
          )
        ) {
          contents = contents.replace(
            /return extraModules;/g,
            `[extraModules addObject:(id<RCTBridgeModule>)[[RCTDevMenu alloc] init]];
  return extraModules;`
          );
        }

        // Add swizzling invocation
        if (!contents.includes(swizzleMethodInvocationBlock)) {
          // self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]
          contents = contents.replace(
            /self\.moduleRegistryAdapter = \[\[UMModuleRegistryAdapter alloc\]/g,
            `${swizzleMethodInvocationBlock}
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]`
          );
        }

        // Add swizzling method
        if (!contents.match(/\(void\)\s?ensureReactMethodSwizzlingSetUp/g)) {
          const sections = contents.split('@end');
          sections[sections.length - 2] += swizzleMethodBlock;
          contents = sections.join('@end');
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

const swizzleMethodInvocationBlock = `[self ensureReactMethodSwizzlingSetUp];`;

const swizzleMethodBlock = `
// Bring back React method swizzling removed from its Pod
// when integrating with Expo client.
// https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
- (void)ensureReactMethodSwizzlingSetUp
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wundeclared-selector"
    // RCTKeyCommands.m
    // swizzle UIResponder
    RCTSwapInstanceMethods([UIResponder class],
                          @selector(keyCommands),
                          @selector(RCT_keyCommands));

    // RCTDevMenu.m
    // We're swizzling here because it's poor form to override methods in a category,
    // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
    // no need to call the original implementation.
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:));
    #pragma clang diagnostic pop
  });
}
`;

module.exports = withDevMenu;
