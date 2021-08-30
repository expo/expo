const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs-extra');
const path = require('path');

const withDevMenu = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const iosRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
      const delegateHeaderPath = path.resolve(iosRoot, 'AppDelegate.h');

      let contents = fs.readFileSync(delegateHeaderPath, {
        encoding: 'utf-8',
      });

      contents = contents.replace(
        '#import <UMCore/UMAppDelegateWrapper.h>\n',
        '#import <ExpoModulesCore/EXAppDelegateWrapper.h>\n'
      );

      contents = contents.replace('UMAppDelegateWrapper', 'EXAppDelegateWrapper');
      await fs.writeFile(delegateHeaderPath, contents);

      return config;
    },
  ]);
};

module.exports = withDevMenu;
