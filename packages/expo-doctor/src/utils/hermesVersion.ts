import JsonFile from '@expo/json-file';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

export interface HermesVersionInfo {
  source: 'hermes-compiler' | 'react-native';
  version: string;
}

function getReactNativeHermesVersion(reactNativePackageJsonPath: string): HermesVersionInfo | null {
  const versionPropertiesPath = path.join(
    path.dirname(reactNativePackageJsonPath),
    'sdks/hermes-engine/version.properties'
  );
  const contents = fs.readFileSync(versionPropertiesPath, 'utf8');
  const version =
    contents.match(/^HERMES_V1_VERSION_NAME=(.+)$/m)?.[1]?.trim() ??
    contents.match(/^HERMES_VERSION_NAME=(.+)$/m)?.[1]?.trim();

  return version && semver.valid(version) ? { source: 'react-native', version } : null;
}

function getHermesCompilerVersion(reactNativePackageJsonPath: string): HermesVersionInfo | null {
  const packageJsonPath = resolveFrom.silent(
    path.dirname(reactNativePackageJsonPath),
    'hermes-compiler/package.json'
  );
  if (!packageJsonPath) {
    return null;
  }

  const { version } = JsonFile.read(packageJsonPath, { json5: true });
  return typeof version === 'string' && semver.valid(version)
    ? { source: 'hermes-compiler', version }
    : null;
}

export function getHermesVersion(projectRoot: string): HermesVersionInfo | null {
  try {
    const reactNativePackageJsonPath = resolveFrom.silent(projectRoot, 'react-native/package.json');
    if (!reactNativePackageJsonPath) {
      return null;
    }

    try {
      return (
        getReactNativeHermesVersion(reactNativePackageJsonPath) ??
        getHermesCompilerVersion(reactNativePackageJsonPath)
      );
    } catch {
      try {
        return getHermesCompilerVersion(reactNativePackageJsonPath);
      } catch {
        return null;
      }
    }
  } catch {
    return null;
  }
}
