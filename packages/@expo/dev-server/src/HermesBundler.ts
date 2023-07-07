import type { ExpoConfig, Platform } from '@expo/config';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import process from 'process';

import {
  importHermesCommandFromProject,
  importMetroSourceMapComposeSourceMapsFromProject,
} from './metro/importMetroFromProject';

export function isEnableHermesManaged(expoConfig: ExpoConfig, platform: Platform): boolean {
  switch (platform) {
    case 'android': {
      return (expoConfig.android?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    case 'ios': {
      return (expoConfig.ios?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    default:
      return false;
  }
}

interface HermesBundleOutput {
  hbc: Uint8Array;
  sourcemap: string;
}
export async function buildHermesBundleAsync(
  projectRoot: string,
  code: string,
  map: string,
  optimize: boolean = false
): Promise<HermesBundleOutput> {
  const tempDir = path.join(os.tmpdir(), `expo-bundler-${process.pid}`);
  await fs.ensureDir(tempDir);
  try {
    const tempBundleFile = path.join(tempDir, 'index.bundle');
    const tempSourcemapFile = path.join(tempDir, 'index.bundle.map');
    await fs.writeFile(tempBundleFile, code);
    await fs.writeFile(tempSourcemapFile, map);

    const tempHbcFile = path.join(tempDir, 'index.hbc');
    const hermesCommand = importHermesCommandFromProject(projectRoot);
    const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile, '-output-source-map'];
    if (optimize) {
      args.push('-O');
    }
    await spawnAsync(hermesCommand, args);

    const [hbc, sourcemap] = await Promise.all([
      fs.readFile(tempHbcFile),
      createHermesSourcemapAsync(projectRoot, map, `${tempHbcFile}.map`),
    ]);
    return {
      hbc,
      sourcemap,
    };
  } finally {
    await fs.remove(tempDir);
  }
}

export async function createHermesSourcemapAsync(
  projectRoot: string,
  sourcemap: string,
  hermesMapFile: string
): Promise<string> {
  const composeSourceMaps = importMetroSourceMapComposeSourceMapsFromProject(projectRoot);
  const bundlerSourcemap = JSON.parse(sourcemap);
  const hermesSourcemap = await fs.readJSON(hermesMapFile);
  return JSON.stringify(composeSourceMaps([bundlerSourcemap, hermesSourcemap]));
}

export function parseGradleProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let line of content.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const sepIndex = line.indexOf('=');
    const key = line.substr(0, sepIndex);
    const value = line.substr(sepIndex + 1);
    result[key] = value;
  }
  return result;
}

export async function maybeThrowFromInconsistentEngineAsync(
  projectRoot: string,
  configFilePath: string,
  platform: string,
  isHermesManaged: boolean
): Promise<void> {
  const configFileName = path.basename(configFilePath);
  if (
    platform === 'android' &&
    (await maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged))
  ) {
    throw new Error(
      `JavaScript engine configuration is inconsistent between ${configFileName} and Android native project.\n` +
        `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
        `In Android native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
        `Please check the following files for inconsistencies:\n` +
        `  - ${configFilePath}\n` +
        `  - ${path.join(projectRoot, 'android', 'gradle.properties')}\n` +
        `  - ${path.join(projectRoot, 'android', 'app', 'build.gradle')}\n` +
        'Learn more: https://expo.fyi/hermes-android-config'
    );
  }

  if (platform === 'ios' && (await maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged))) {
    throw new Error(
      `JavaScript engine configuration is inconsistent between ${configFileName} and iOS native project.\n` +
        `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
        `In iOS native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
        `Please check the following files for inconsistencies:\n` +
        `  - ${configFilePath}\n` +
        `  - ${path.join(projectRoot, 'ios', 'Podfile')}\n` +
        `  - ${path.join(projectRoot, 'ios', 'Podfile.properties.json')}\n` +
        'Learn more: https://expo.fyi/hermes-ios-config'
    );
  }
}

export async function maybeInconsistentEngineAndroidAsync(
  projectRoot: string,
  isHermesManaged: boolean
): Promise<boolean> {
  // Trying best to check android native project if by chance to be consistent between app config

  // Check gradle.properties from prebuild template
  const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(await fs.readFile(gradlePropertiesPath, 'utf8'));
    const isHermesBare = props['hermesEnabled'] === 'true';
    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
}

export async function maybeInconsistentEngineIosAsync(
  projectRoot: string,
  isHermesManaged: boolean
): Promise<boolean> {
  // Trying best to check ios native project if by chance to be consistent between app config

  // Check ios/Podfile for ":hermes_enabled => true"
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (fs.existsSync(podfilePath)) {
    const content = await fs.readFile(podfilePath, 'utf8');
    const isPropsReference =
      content.search(
        /^\s*:hermes_enabled\s*=>\s*podfile_properties\['expo.jsEngine'\]\s*==\s*nil\s*\|\|\s*podfile_properties\['expo.jsEngine'\]\s*==\s*'hermes',?/m
      ) >= 0;
    const isHermesBare = content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;
    if (!isPropsReference && isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  // Check Podfile.properties.json from prebuild template
  const podfilePropertiesPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
  if (fs.existsSync(podfilePropertiesPath)) {
    const props = await parsePodfilePropertiesAsync(podfilePropertiesPath);
    const isHermesBare = props['expo.jsEngine'] === 'hermes';
    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
}

// https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
const HERMES_MAGIC_HEADER = 'c61fbc03c103191f';

export async function isHermesBytecodeBundleAsync(file: string): Promise<boolean> {
  const header = await readHermesHeaderAsync(file);
  return header.slice(0, 8).toString('hex') === HERMES_MAGIC_HEADER;
}

export async function getHermesBytecodeBundleVersionAsync(file: string): Promise<number> {
  const header = await readHermesHeaderAsync(file);
  if (header.slice(0, 8).toString('hex') !== HERMES_MAGIC_HEADER) {
    throw new Error('Invalid hermes bundle file');
  }
  return header.readUInt32LE(8);
}

async function readHermesHeaderAsync(file: string): Promise<Buffer> {
  const fd = await fs.open(file, 'r');
  const buffer = Buffer.alloc(12);
  await fs.read(fd, buffer, 0, 12, null);
  await fs.close(fd);
  return buffer;
}

async function parsePodfilePropertiesAsync(
  podfilePropertiesPath: string
): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(podfilePropertiesPath, 'utf8'));
  } catch {
    return {};
  }
}
