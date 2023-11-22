import {
  ConfigPlugin,
  withAppBuildGradle,
  withAppDelegate,
  withDangerousMod,
  withMainApplication,
  withPlugins,
} from '@expo/config-plugins';
import { appendContentsInsideDeclarationBlock } from '@expo/config-plugins/build/android/codeMod';
import fs from 'fs';
import path from 'path';
import { ISA, PBXShellScriptBuildPhase } from 'xcparse';

import { withXCParseXcodeProject } from '../ios/withXCParseXcodeProject';

export const withCliIntegration: ConfigPlugin = config => {
  return withPlugins(config, [
    withCliAndroidGradle,
    withCliAndroidMainApplication,
    withCliIosAppDelegate,
    withCliIosXcodeProject,
    withCliBabelConfig,
    withCliMetroConfig,
    withCliGitIgnore,
  ]);
};

const withCliAndroidGradle: ConfigPlugin = config => {
  return withAppBuildGradle(config, config => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('Cannot setup kotlin because the build.gradle is not groovy');
    }
    config.modResults.contents = updateAndroidGradleFile(config.modResults.contents);
    return config;
  });
};

const withCliAndroidMainApplication: ConfigPlugin = config => {
  return withMainApplication(config, config => {
    config.modResults.contents = updateVirtualMetroEntryAndroid(config.modResults.contents);
    return config;
  });
};

const withCliIosAppDelegate: ConfigPlugin = config => {
  return withAppDelegate(config, config => {
    config.modResults.contents = updateVirtualMetroEntryIos(config.modResults.contents);
    return config;
  });
};

const withCliIosXcodeProject: ConfigPlugin = config => {
  return withXCParseXcodeProject(config, config => {
    const pbxproj = config.modResults;
    for (const section of Object.values(pbxproj.objects ?? {})) {
      if (section.isa === ISA.PBXShellScriptBuildPhase) {
        updateIosXcodeProjectBuildPhase(section as PBXShellScriptBuildPhase);
      }
    }
    return config;
  });
};

const withCliBabelConfig: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const babelConfigPath = path.join(config.modRequest.projectRoot, 'babel.config.js');
      let contents = await fs.promises.readFile(babelConfigPath, 'utf8');
      contents = updateBabelConfig(contents);
      await fs.promises.writeFile(babelConfigPath, contents);
      return config;
    },
  ]);
};

const withCliMetroConfig: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const metroConfigPath = path.join(config.modRequest.projectRoot, 'metro.config.js');
      let contents = await fs.promises.readFile(metroConfigPath, 'utf8');
      contents = updateMetroConfig(contents);
      await fs.promises.writeFile(metroConfigPath, contents);
      return config;
    },
  ]);
};

const withCliGitIgnore: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const gitIgnorePath = path.join(config.modRequest.projectRoot, '.gitignore');
      let contents = await fs.promises.readFile(gitIgnorePath, 'utf8');
      contents = updateGitIgnore(contents);
      await fs.promises.writeFile(gitIgnorePath, contents);
      return config;
    },
  ]);
};

export function updateAndroidGradleFile(contents: string): string {
  const cliContents = `\
    //
    // Added by install-expo-modules
    entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')", rootDir.getAbsoluteFile().getParentFile().getAbsolutePath(), "android", "absolute"].execute(null, rootDir).text.trim())
    cliFile = new File(["node", "--print", "require.resolve('@expo/cli')"].execute(null, rootDir).text.trim())
    bundleCommand = "export:embed"\n`;
  if (contents.indexOf(cliContents) === -1) {
    contents = appendContentsInsideDeclarationBlock(contents, 'react', cliContents);
  }
  return contents;
}

export function updateBabelConfig(contents: string): string {
  return contents.replace(/['"]module:metro-react-native-babel-preset['"]/g, `'babel-preset-expo'`);
}

export function updateMetroConfig(contents: string): string {
  const searchPattern = /^const \{\s*getDefaultConfig, mergeConfig\s*\} = require\('@react-native\/metro-config'\);$/m;
  if (!contents.match(searchPattern)) {
    console.warn(
      '⚠️  Unrecognized `metro.config.js` content, will skip the process to update `metro.config.js`. Please manually update the contents to use the `getDefaultConfig()` from `expo/metro-config`.'
    );
    return contents;
  }
  return contents.replace(
    searchPattern,
    `\
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');`
  );
}

export function updateVirtualMetroEntryAndroid(contents: string): string {
  return contents.replace(/^(\s*return\s+")(index)(";?)$/m, `$1.expo/.virtual-metro-entry$3`);
}

export function updateVirtualMetroEntryIos(contents: string): string {
  return contents.replace(
    /^(\s*return.*RCTBundleURLProvider.*jsBundleURLForBundleRoot:@")(index)(".*;)$/m,
    `$1.expo/.virtual-metro-entry$3`
  );
}

export function updateIosXcodeProjectBuildPhase(
  section: PBXShellScriptBuildPhase
): PBXShellScriptBuildPhase {
  if (section.name === 'Start Packager') {
    section.shellScript = `\
if [[ -f "$PODS_ROOT/../.xcode.env" ]]; then
  source "$PODS_ROOT/../.xcode.env"
fi
if [[ -f "$PODS_ROOT/../.xcode.env.local" ]]; then
  source "$PODS_ROOT/../.xcode.env.local"
fi

export RCT_METRO_PORT="\${RCT_METRO_PORT:=8081}"
echo "export RCT_METRO_PORT=\${RCT_METRO_PORT}" > \`$NODE_BINARY --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/.packager.env'"\`
if [ -z "\${RCT_NO_LAUNCH_PACKAGER+xxx}" ] ; then
  if nc -w 5 -z localhost \${RCT_METRO_PORT} ; then
    if ! curl -s "http://localhost:\${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then
      echo "Port \${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"
      exit 2
    fi
  else
    open \`$NODE_BINARY --print "require('path').dirname(require.resolve('expo/package.json')) + '/scripts/launchPackager.command'"\` || echo "Can't start packager automatically"
  fi
fi
`;
  }

  if (section.name === 'Bundle React Native code and images') {
    section.shellScript = `\
if [[ -f "$PODS_ROOT/../.xcode.env" ]]; then
  source "$PODS_ROOT/../.xcode.env"
fi
if [[ -f "$PODS_ROOT/../.xcode.env.local" ]]; then
  source "$PODS_ROOT/../.xcode.env.local"
fi

# The project root by default is one level up from the ios directory
export PROJECT_ROOT="$PROJECT_DIR"/..

if [[ "$CONFIGURATION" = *Debug* ]]; then
  export SKIP_BUNDLING=1
fi
if [[ -z "$ENTRY_FILE" ]]; then
  # Set the entry JS file using the bundler's entry resolution.
  export ENTRY_FILE="$("$NODE_BINARY" -e "require('expo/scripts/resolveAppEntry')" "$PROJECT_ROOT" ios relative | tail -n 1)"
fi

if [[ -z "$CLI_PATH" ]]; then
  # Use Expo CLI
  export CLI_PATH="$("$NODE_BINARY" --print "require.resolve('@expo/cli')")"
fi
if [[ -z "$BUNDLE_COMMAND" ]]; then
  # Default Expo CLI command for bundling
  export BUNDLE_COMMAND="export:embed"
fi

\`"$NODE_BINARY" --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'"\`
`;
  }

  return section;
}

export function updateGitIgnore(contents: string): string {
  if (contents.match(/^\.expo$/m)) {
    return contents;
  }
  return (
    contents +
    `
# Expo
.expo
dist/
web-build/`
  );
}
