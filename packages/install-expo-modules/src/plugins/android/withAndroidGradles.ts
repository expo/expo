import { ConfigPlugin, withProjectBuildGradle } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

// Because regexp //g is stateful, to use it multiple times, we should create a new one.
function createAgpRegExp() {
  return /^(\s*classpath[(\s]["']com\.android\.tools\.build:gradle:)(\d+\.\d+\.\d+)(["'][)\s]\s*)$/gm;
}

export async function shouldUpdateAgpVersionAsync(projectRoot: string, targetVersion: string) {
  const gradlePath = path.join(projectRoot, 'android', 'build.gradle');
  const content = await fs.promises.readFile(gradlePath, 'utf-8');
  const matchResult = createAgpRegExp().exec(content);
  if (!matchResult) {
    console.warn(
      'Unrecognized `android/build.gradle` content, will skip the process to update AGP version.'
    );
    return false;
  }

  const version = matchResult[2];
  if (!version) {
    console.warn(
      'Unrecognized `android/build.gradle` content, will skip the process to update AGP version.'
    );
    return false;
  }

  return semver.lt(toSemVer(version), toSemVer(targetVersion));
}

export const withAndroidGradlePluginVersion: ConfigPlugin<{ androidAgpVersion: string }> = (
  config,
  prop
) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('Cannot setup kotlin because the build.gradle is not groovy');
    }
    const matchResult = createAgpRegExp().exec(config.modResults.contents);
    if (matchResult) {
      const version = matchResult[2];
      if (version && semver.lt(toSemVer(version), toSemVer(prop.androidAgpVersion))) {
        config.modResults.contents = config.modResults.contents.replace(
          createAgpRegExp(),
          (match, prefix, versionPart, suffix) => {
            return `${prefix}${prop.androidAgpVersion}${suffix}`;
          }
        );
      }
    }
    return config;
  });
};

export const withAndroidModulesProjectBuildGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents = updateAndroidProjectBuildGradle({
      contents: config.modResults.contents,
      isGroovy: config.modResults.language === 'groovy',
      sdkVersion: config.sdkVersion,
    });
    return config;
  });
};

export function updateAndroidProjectBuildGradle({
  contents,
  isGroovy,
  sdkVersion,
}: {
  contents: string;
  isGroovy: boolean;
  sdkVersion: string | undefined;
}) {
  if (sdkVersion && semver.lt(sdkVersion, '53.0.0')) {
    return contents;
  }

  if (!contents.match(/"expo-root-project"/)) {
    if (isGroovy) {
      contents += `apply plugin: "expo-root-project"\n`;
    } else {
      contents = contents.replace(
        /^(plugins\s+?\{[\s\S]+?)(\})/m,
        `$1  id("expo-root-project")\n$2`
      );
    }
  }

  return contents;
}

function toSemVer(version: string): semver.SemVer {
  return semver.coerce(version) ?? new semver.SemVer('0.0.0');
}
