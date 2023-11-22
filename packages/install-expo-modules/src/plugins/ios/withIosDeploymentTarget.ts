import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';
import { ISA, XCBuildConfiguration } from 'xcparse';

import { withXCParseXcodeProject, XCParseXcodeProject } from './withXCParseXcodeProject';

type IosDeploymentTargetConfigPlugin = ConfigPlugin<{ deploymentTarget: string }>;

export const withIosDeploymentTarget: IosDeploymentTargetConfigPlugin = (config, props) => {
  config = withIosDeploymentTargetPodfile(config, props);
  config = withIosDeploymentTargetXcodeProject(config, props);
  return config;
};

const withIosDeploymentTargetPodfile: IosDeploymentTargetConfigPlugin = (config, props) => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = await fs.promises.readFile(podfile, 'utf8');
      contents = await updateDeploymentTargetPodfile(
        config.modRequest.projectRoot,
        contents,
        props.deploymentTarget
      );

      await fs.promises.writeFile(podfile, contents);
      return config;
    },
  ]);
};

// Because regexp //g is stateful, to use it multiple times, we should create a new one.
function createPodfilePlatformRegExp() {
  return /^(\s*platform :ios,\s*)(['"][\d.]+['"]|min_ios_version_supported)/gm;
}

async function parseVersionAsync(projectRoot: string, versionPart: string): Promise<string | null> {
  let version;
  if (versionPart === 'min_ios_version_supported') {
    version = await lookupReactNativeMinIosVersionSupported(projectRoot);
  } else {
    version = versionPart.replace(/'"/g, '');
  }
  return version;
}

export async function updateDeploymentTargetPodfile(
  projectRoot: string,
  contents: string,
  deploymentTarget: string
): Promise<string> {
  const matchResult = createPodfilePlatformRegExp().exec(contents);
  if (matchResult) {
    const version = await parseVersionAsync(projectRoot, matchResult[2]);
    if (version && semver.lt(toSemVer(version), toSemVer(deploymentTarget))) {
      return contents.replace(createPodfilePlatformRegExp(), (match, prefix, versionPart) => {
        return `${prefix}'${deploymentTarget}'`;
      });
    }
  }
  return contents;
}

export async function shouldUpdateDeployTargetPodfileAsync(
  projectRoot: string,
  targetVersion: string
) {
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  const podfile = await fs.promises.readFile(podfilePath, 'utf-8');
  const matchResult = createPodfilePlatformRegExp().exec(podfile);
  if (!matchResult) {
    console.warn(
      'Unrecognized `ios/Podfile` content, will skip the process to update minimum iOS supported version.'
    );
    return false;
  }

  const version = await parseVersionAsync(projectRoot, matchResult[2]);
  if (!version) {
    console.warn(
      'Unrecognized `ios/Podfile` content, will skip the process to update minimum iOS supported version.'
    );
    return false;
  }

  return semver.lt(toSemVer(version), toSemVer(targetVersion));
}

export async function lookupReactNativeMinIosVersionSupported(
  projectRoot: string
): Promise<string | null> {
  // [0] Try to parse the default version from **scripts/cocoapods/helpers.rb**
  const reactNativeCocoaPodsHelper = resolveFrom.silent(
    projectRoot,
    'react-native/scripts/cocoapods/helpers.rb'
  );
  if (reactNativeCocoaPodsHelper) {
    try {
      const content = await fs.promises.readFile(reactNativeCocoaPodsHelper, 'utf-8');
      const matchRepExp = /^\s*def self\.min_ios_version_supported\n\s*return\s*['"]([\d.]+)['"]/gm;
      const matchResult = matchRepExp.exec(content);
      if (matchResult) {
        return matchResult[1];
      }
    } catch {}
  }

  // [1] Try to parse the default version from **scripts/react_native_pods.rb**
  const reactNativePodsScript = resolveFrom.silent(
    projectRoot,
    'react-native/scripts/react_native_pods.rb'
  );
  if (reactNativePodsScript) {
    try {
      const content = await fs.promises.readFile(reactNativePodsScript, 'utf-8');
      const matchRepExp = /^def min_ios_version_supported\n\s*return\s*['"]([\d.]+)['"]/gm;
      const matchResult = matchRepExp.exec(content);
      if (matchResult) {
        return matchResult[1];
      }
    } catch {}
  }

  return null;
}

const withIosDeploymentTargetXcodeProject: IosDeploymentTargetConfigPlugin = (config, props) => {
  return withXCParseXcodeProject(config, config => {
    config.modResults = updateDeploymentTargetXcodeProject(
      config.modResults,
      props.deploymentTarget
    );
    return config;
  });
};

export function updateDeploymentTargetXcodeProject(
  project: XCParseXcodeProject,
  deploymentTarget: string
): XCParseXcodeProject {
  for (const section of Object.values(project.objects ?? {})) {
    if (section.isa === ISA.XCBuildConfiguration) {
      const { buildSettings } = section as XCBuildConfiguration;
      const currDeploymentTarget = buildSettings?.IPHONEOS_DEPLOYMENT_TARGET;
      if (
        currDeploymentTarget &&
        semver.lt(toSemVer(currDeploymentTarget), toSemVer(deploymentTarget))
      ) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      }
    }
  }
  return project;
}

function toSemVer(version: string): semver.SemVer {
  return semver.coerce(version) ?? new semver.SemVer('0.0.0');
}
