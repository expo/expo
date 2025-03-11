import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import { composeSourceMaps } from 'metro-source-map';
import os from 'os';
import path from 'path';
import process from 'process';

const debug = require('debug')('expo:metro:hermes') as typeof console.log;

function importHermesCommandFromProject(): string {
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

interface HermesBundleOutput {
  hbc: Uint8Array;
  sourcemap: string | null;
}

type BuildHermesOptions = {
  filename: string;
  code: string;
  map: string | null;
  minify?: boolean;
};

// Only one hermes build at a time is supported.
let currentHermesBuild: Promise<HermesBundleOutput> | null = null;

export async function buildHermesBundleAsync(
  options: BuildHermesOptions
): Promise<HermesBundleOutput> {
  if (currentHermesBuild) {
    debug(`Waiting for existing Hermes builds to finish`);
    await currentHermesBuild;
  }
  currentHermesBuild = directlyBuildHermesBundleAsync(options);
  return await currentHermesBuild;
}

async function directlyBuildHermesBundleAsync({
  code,
  map,
  minify = false,
  filename,
}: BuildHermesOptions): Promise<HermesBundleOutput> {
  const tempDir = path.join(os.tmpdir(), `expo-bundler-${Math.random()}-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  try {
    const tempBundleFile = path.join(tempDir, 'index.js');
    await fs.promises.writeFile(tempBundleFile, code, 'utf8');

    if (map) {
      const tempSourcemapFile = path.join(tempDir, 'index.js.map');
      await fs.promises.writeFile(tempSourcemapFile, map, 'utf8');
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
      hbc = await fs.promises.readFile(tempHbcFile);
    } else {
      [hbc, sourcemap] = await Promise.all([
        fs.promises.readFile(tempHbcFile),
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
    await fs.promises.rm(tempDir, { force: true, recursive: true });
  }
}

async function createHermesSourcemapAsync(
  sourcemap: string,
  hermesMapFile: string
): Promise<string> {
  const bundlerSourcemap = JSON.parse(sourcemap);
  const hermesSourcemapContent = await fs.promises.readFile(hermesMapFile, 'utf8');
  const hermesSourcemap = JSON.parse(hermesSourcemapContent);
  return JSON.stringify(composeSourceMaps([bundlerSourcemap, hermesSourcemap]));
}
