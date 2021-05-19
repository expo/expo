import { ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import path from 'path';
import resolveFrom from 'resolve-from';

const DEV_LAUNCHER_SCRIPT_PATH = 'expo-dev-launcher/scripts/ios.sh';

type XcodeProject = any;

interface ShellScriptBuildPhase {
  isa: 'PBXShellScriptBuildPhase';
  name: string;
  shellScript: string;
  [key: string]: any;
}

function getBundleReactNativePhase(project: XcodeProject): ShellScriptBuildPhase {
  const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase as Record<
    string,
    ShellScriptBuildPhase
  >;
  const bundleReactNative = Object.values(shellScriptBuildPhase).find(
    buildPhase => buildPhase.name === '"Bundle React Native code and images"'
  );

  if (!bundleReactNative) {
    throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
  }

  return bundleReactNative;
}

function formatConfigurationScriptPath(projectRoot: string): string {
  const buildScriptPath = resolveFrom.silent(projectRoot, DEV_LAUNCHER_SCRIPT_PATH);

  if (!buildScriptPath) {
    throw new Error(
      "Could not find the build script for iOS. This can happen in the case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date."
    );
  }

  return path.relative(path.join(projectRoot, 'ios'), buildScriptPath);
}

function isShellScriptBuildPhaseConfigured(projectRoot: string, project: XcodeProject): boolean {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}

export function modifyReactNativeBuildPhase(
  projectRoot: string,
  project: XcodeProject
): XcodeProject {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);

  if (!isShellScriptBuildPhaseConfigured(projectRoot, project)) {
    // check if there's already another path to create-manifest-ios.sh
    // this might be the case for monorepos
    if (bundleReactNative.shellScript.includes(DEV_LAUNCHER_SCRIPT_PATH)) {
      bundleReactNative.shellScript = bundleReactNative.shellScript.replace(
        new RegExp(`(\\\\n)(\\.\\.)+/node_modules/${DEV_LAUNCHER_SCRIPT_PATH}`),
        ''
      );
    }
    bundleReactNative.shellScript = `${bundleReactNative.shellScript.replace(
      /"$/,
      ''
    )}${buildPhaseShellScriptPath}\\n"`;
  }
  return project;
}

export const withDevLauncherXcodeProject: ConfigPlugin = config => {
  return withXcodeProject(config, async config => {
    const projectRoot = config.modRequest.projectRoot;
    const xcodeProject = config.modResults;
    modifyReactNativeBuildPhase(projectRoot, xcodeProject);
    return config;
  });
};
