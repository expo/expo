import fs from 'node:fs';
import path from 'node:path';
import * as tar from 'tar';

import { EXPO_DIR } from '../Constants';
import Git from '../Git';
import { spawnAsync, spawnErrorOutput } from '../Utils';

export type AbiModule = {
  packageName: 'expo-modules-core' | 'expo-modules-jsi';
  productName: 'ExpoModulesCore' | 'ExpoModulesJSI';
};

export const CORE_MODULE: AbiModule = {
  packageName: 'expo-modules-core',
  productName: 'ExpoModulesCore',
};
export const JSI_MODULE: AbiModule = {
  packageName: 'expo-modules-jsi',
  productName: 'ExpoModulesJSI',
};

export const ABI_FILE = 'arm64-apple-ios-simulator.abi.json';

export type NpmPack = (spec: string, destination: string) => Promise<string | null>;

export function xcframeworkAbiPath(xcframework: string, productName: string): string {
  return path.join(
    xcframework,
    'ios-arm64_x86_64-simulator',
    `${productName}.framework`,
    'Modules',
    `${productName}.swiftmodule`,
    ABI_FILE
  );
}

export async function readBaseVersionAsync(baseRef: string, packageName: string): Promise<string> {
  const manifest = await Git.readFileAsync(
    baseRef,
    path.join(EXPO_DIR, 'packages', packageName, 'package.json')
  );
  return JSON.parse(manifest).version;
}

export type BaselineAbi =
  | { status: 'found'; path: string }
  | { status: 'unpublished' }
  | { status: 'missing' };

export function isUnpublishedError(output: string): boolean {
  return /\b(E404|ETARGET)\b/.test(output);
}

const npmPackAsync: NpmPack = async (spec, destination) => {
  try {
    const { stdout } = await spawnAsync('npm', [
      'pack',
      spec,
      '--pack-destination',
      destination,
      '--json',
    ]);
    const [{ filename }] = JSON.parse(stdout.slice(stdout.indexOf('[')));
    return path.join(destination, filename);
  } catch (error) {
    if (isUnpublishedError(spawnErrorOutput(error))) {
      return null;
    }
    throw error;
  }
};

export async function resolveBaselineAbiAsync(
  module: AbiModule,
  version: string,
  workDir: string,
  pack: NpmPack = npmPackAsync
): Promise<BaselineAbi> {
  const destination = path.join(workDir, `${module.packageName}-${version}`);
  await fs.promises.mkdir(destination, { recursive: true });
  const tarball = await pack(`${module.packageName}@${version}`, destination);
  if (!tarball) {
    return { status: 'unpublished' };
  }
  await tar.x({ file: tarball, cwd: destination });
  const packageRoot = path.join(destination, 'package');

  const stagedAbi = path.join(packageRoot, 'prebuilds/abi', module.productName, ABI_FILE);
  if (fs.existsSync(stagedAbi)) {
    return { status: 'found', path: stagedAbi };
  }
  const frameworkTarball = path.join(
    packageRoot,
    'prebuilds/output/release/xcframeworks',
    `${module.productName}.tar.gz`
  );
  if (!fs.existsSync(frameworkTarball)) {
    return { status: 'missing' };
  }
  await tar.x({ file: frameworkTarball, cwd: destination });
  const abiFile = xcframeworkAbiPath(
    path.join(destination, `${module.productName}.xcframework`),
    module.productName
  );
  return fs.existsSync(abiFile) ? { status: 'found', path: abiFile } : { status: 'missing' };
}
