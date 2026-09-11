import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'node:path';

import { EXPO_DIR } from '../Constants';

export type AndroidToolchainVersions = {
  buildTools: string;
  compileSdk: string;
  ndkVersion: string;
};

type AndroidSdkInstaller = {
  command: string;
  installArgs: (components: string[]) => string[];
};

export function parseAndroidToolchainVersions(versionCatalog: string): AndroidToolchainVersions {
  const readVersion = (name: keyof AndroidToolchainVersions): string => {
    const match = versionCatalog.match(new RegExp(`^${name}\\s*=\\s*["']([^"']+)["']`, 'm'));
    if (!match) {
      throw new Error(`React Native version catalog does not define ${name}`);
    }
    return match[1];
  };

  return {
    buildTools: readVersion('buildTools'),
    compileSdk: readVersion('compileSdk'),
    ndkVersion: readVersion('ndkVersion'),
  };
}

export function findSdkManager(
  env: NodeJS.ProcessEnv = process.env,
  pathExists: (filePath: string) => boolean = fs.existsSync
): string {
  const executable = process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager';
  const sdkRoots = [env.ANDROID_HOME, env.ANDROID_SDK_ROOT].filter(
    (value): value is string => !!value
  );
  const candidates = [
    ...sdkRoots.flatMap((root) => [
      path.join(root, 'cmdline-tools', 'latest', 'bin', executable),
      path.join(root, 'tools', 'bin', executable),
    ]),
    ...(env.PATH ?? '').split(path.delimiter).map((directory) => path.join(directory, executable)),
  ];
  const sdkManager = candidates.find(pathExists);
  if (!sdkManager) {
    throw new Error(
      'Unable to find sdkmanager. Install the Android command-line tools and set ANDROID_HOME or ANDROID_SDK_ROOT.'
    );
  }
  return sdkManager;
}

export function findAndroidSdkInstaller(
  env: NodeJS.ProcessEnv = process.env,
  pathExists: (filePath: string) => boolean = fs.existsSync
): AndroidSdkInstaller {
  try {
    const sdkManager = findSdkManager(env, pathExists);
    return {
      command: sdkManager,
      installArgs: (components) => ['--install', ...components],
    };
  } catch {}

  const androidExecutable = process.platform === 'win32' ? 'android.exe' : 'android';
  const android = (env.PATH ?? '')
    .split(path.delimiter)
    .map((directory) => path.join(directory, androidExecutable))
    .find(pathExists);
  if (!android) {
    throw new Error(
      'Unable to find sdkmanager or the Android CLI. Install the Android command-line tools and set ANDROID_HOME or ANDROID_SDK_ROOT.'
    );
  }
  return {
    command: android,
    installArgs: (components) => [
      'sdk',
      'install',
      ...components.map((component) => component.replaceAll(';', '/')),
    ],
  };
}

export async function prepareAndroidPrecompileToolchainAsync(): Promise<void> {
  const bareExpoRoot = path.join(EXPO_DIR, 'apps/bare-expo');
  const reactNativePackageJson = require.resolve('react-native/package.json', {
    paths: [bareExpoRoot],
  });
  const versionCatalogPath = path.join(
    path.dirname(reactNativePackageJson),
    'gradle/libs.versions.toml'
  );
  const versions = parseAndroidToolchainVersions(await fs.readFile(versionCatalogPath, 'utf8'));
  const components = [
    `platforms;android-${versions.compileSdk}`,
    `build-tools;${versions.buildTools}`,
    `ndk;${versions.ndkVersion}`,
  ];

  console.log(`Preparing Android precompile toolchain: ${components.join(', ')}`);
  const installer = findAndroidSdkInstaller();
  await spawnAsync(installer.command, installer.installArgs(components), { stdio: 'inherit' });
}
