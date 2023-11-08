import { ExpoConfig } from '@expo/config';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import { composeSourceMaps } from 'metro-source-map';
import os from 'os';
import path from 'path';
import process from 'process';
import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:metro:hermes') as typeof console.log;

export function importHermesCommandFromProject(): string {
  const platformExecutable = getHermesCommandPlatform();
  const hermescLocations = [
    // Override hermesc dir by environment variables
    process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']
      ? `${process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']}/build/bin/hermesc`
      : '',

    // Building hermes from source
    'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc',

    // Prebuilt hermesc in official react-native 0.69+
    `react-native/sdks/hermesc/${platformExecutable}`,

    // Legacy hermes-engine package
    `hermes-engine/${platformExecutable}`,
  ];

  for (const location of hermescLocations) {
    try {
      return require.resolve(location);
    } catch {}
  }
  throw new Error('Cannot find the hermesc executable.');
}

function getHermesCommandPlatform(): string {
  switch (os.platform()) {
    case 'darwin':
      return 'osx-bin/hermesc';
    case 'linux':
      return 'linux64-bin/hermesc';
    case 'win32':
      return 'win64-bin/hermesc.exe';
    default:
      throw new Error(`Unsupported host platform for Hermes compiler: ${os.platform()}`);
  }
}

export function isEnableHermesManaged(
  expoConfig: Partial<Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>>,
  platform: string
): boolean {
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
  sourcemap: string | null;
}
export async function buildHermesBundleAsync({
  code,
  map,
  minify = false,
  filename,
}: {
  filename: string;
  code: string;
  map: string | null;
  minify?: boolean;
}): Promise<HermesBundleOutput> {
  const tempDir = path.join(os.tmpdir(), `expo-bundler-${process.pid}`);
  await fs.ensureDir(tempDir);
  try {
    const tempBundleFile = path.join(tempDir, 'index.js');
    await fs.writeFile(tempBundleFile, code);

    if (map) {
      const tempSourcemapFile = path.join(tempDir, 'index.js.map');
      await fs.writeFile(tempSourcemapFile, map);
    }

    const tempHbcFile = path.join(tempDir, 'index.hbc');
    const hermesCommand = importHermesCommandFromProject();
    const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile];
    if (minify) {
      args.push('-O');
    }
    if (map) {
      args.push('-output-source-map');
    }

    debug(`Running hermesc: ${hermesCommand} ${args.join(' ')}`);
    await spawnAsync(hermesCommand, args);

    let hbc: Buffer;
    let sourcemap: string | null = null;

    if (!map) {
      hbc = await fs.readFile(tempHbcFile);
    } else {
      [hbc, sourcemap] = await Promise.all([
        fs.readFile(tempHbcFile),
        createHermesSourcemapAsync(map, `${tempHbcFile}.map`),
      ]);
    }
    return {
      hbc,
      sourcemap,
    };
  } catch (error: any) {
    console.error(chalk.red(`\nFailed to generate Hermes bytecode for: ${filename}`));
    if ('status' in error) {
      console.error(error.output.join('\n'));
    }
    throw error;
  } finally {
    // await fs.remove(tempDir);
  }
}

export async function createHermesSourcemapAsync(
  sourcemap: string,
  hermesMapFile: string
): Promise<string> {
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
