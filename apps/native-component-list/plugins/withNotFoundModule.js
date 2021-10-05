const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');

// Append this block to the AppDelegate to fix https://stackoverflow.com/a/56160671/4047926
const customBlockObjc = `// [Custom]: Fixes \`Unable to find module for DevMenu\`
#if RCT_DEV
- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName {
  return YES;
}
#endif

`;

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        if (!contents.match(/didNotFindModule:\(NSString\s?\*\)moduleName/)) {
          const sections = contents.split('@end');
          sections[sections.length - 2] += customBlockObjc;
          contents = sections.join('@end');
        }
      } else {
        throw new Error(
          `Cannot append didNotFindModule method to AppDelegate of language "${fileInfo.language}"`
        );
      }
      await fs.writeFile(fileInfo.path, contents);

      return config;
    },
  ]);
};
