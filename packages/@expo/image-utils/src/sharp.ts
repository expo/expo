import { resolveGlobal } from '@expo/require-utils';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import type sharp from 'sharp';

import { env } from './env';
import type { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';

const SHARP_REQUIRED_VERSION = '^0.35.0';

export async function resizeBufferAsync(buffer: Buffer, sizes: number[]): Promise<Buffer[]> {
  const sharp = await findSharpInstanceAsync();

  const metadata = await sharp(buffer).metadata();
  // Create buffer for each size
  const resizedBuffers = await Promise.all(
    sizes.map((dimension) => {
      const density =
        metadata.density != null
          ? (dimension / Math.max(metadata.width, metadata.height)) * metadata.density
          : null;

      return sharp(buffer, {
        density: density == null ? undefined : Math.ceil(density),
      })
        .resize(dimension, dimension, { fit: 'contain', background: 'transparent' })
        .toBuffer();
    })
  );

  return resizedBuffers;
}

/**
 * Returns `true` if a global sharp instance can be found.
 * This functionality can be overridden with `process.env.EXPO_IMAGE_UTILS_NO_SHARP=1`.
 */
export async function isAvailableAsync(): Promise<boolean> {
  if (env.EXPO_IMAGE_UTILS_NO_SHARP) {
    return false;
  }
  try {
    // Attempt to find Sharp
    await findSharpInstanceAsync();
    // Only mark as available when module is found
    return !!_sharpInstance;
  } catch {
    return false;
  }
}

export async function sharpAsync(
  options: SharpGlobalOptions,
  commands: SharpCommandOptions[] = []
): Promise<string[]> {
  const sharp = await findSharpInstanceAsync();

  const {
    compressionLevel,
    format,
    input,
    limitInputPixels,
    output,
    progressive,
    quality,
    withMetadata,
  } = options;

  try {
    let pipeline: sharp.Sharp = sharp(input, {
      limitInputPixels: limitInputPixels || undefined,
    });

    for (const command of commands) {
      pipeline = applyCommand(pipeline, command);
    }

    // Apply encoder options for every format they're relevant to. `force: false` means each
    // only takes effect if the output ends up being encoded to that particular format.
    if (quality != null || progressive != null || compressionLevel != null) {
      pipeline = pipeline
        .jpeg({ quality, progressive, force: false })
        .png({ compressionLevel, progressive, force: false })
        .webp({ quality, force: false })
        .tiff({ quality, force: false });
    }

    if (withMetadata) {
      pipeline = pipeline.withMetadata();
    }

    if (format && format !== 'input') {
      pipeline = pipeline.toFormat(format === 'jpg' ? 'jpeg' : format);
    }

    await pipeline.toFile(output);
    return [output];
  } catch (error: any) {
    throw new Error('\nProcessing image using sharp failed: ' + error.message);
  }
}

function applyCommand(pipeline: sharp.Sharp, command: SharpCommandOptions): sharp.Sharp {
  switch (command.operation) {
    case 'flatten':
      return pipeline.flatten({ background: command.background });
    case 'removeAlpha':
      return pipeline.removeAlpha();
    case 'resize': {
      const { width, height, ...rest } = command;
      return pipeline.resize(width, height, rest);
    }
  }
}

let _sharpInstance: typeof import('sharp') | null = null;

function resolveSharpEntryPath(): string | null {
  try {
    return resolveGlobal('sharp');
  } catch {
    try {
      return require.resolve('sharp');
    } catch (error) {
      if (env.EXPO_IMAGE_UTILS_DEBUG) {
        console.warn('Sharp could not be loaded, reason:', error);
      }
      return null;
    }
  }
}

// `sharp`'s package.json restricts its subpath exports, so `require.resolve('sharp/package.json')`
// throws. Walk up from the resolved entry file to find it on disk instead.
function findPackageJson(entryFile: string): { version: string } {
  let dir = path.dirname(entryFile);
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate a package.json above "${entryFile}"`);
    }
    dir = parent;
  }
  return require(path.join(dir, 'package.json'));
}

async function findSharpModuleAsync(): Promise<typeof import('sharp') | null> {
  if (_sharpInstance) return _sharpInstance;

  const sharpEntryPath = resolveSharpEntryPath();
  if (!sharpEntryPath) {
    return null;
  }

  const sharpPackage = findPackageJson(sharpEntryPath);
  if (!semver.satisfies(sharpPackage.version, SHARP_REQUIRED_VERSION)) {
    showVersionMismatchWarning(SHARP_REQUIRED_VERSION, sharpPackage.version);
    return null;
  }

  _sharpInstance = require(sharpEntryPath);
  return _sharpInstance;
}

/**
 * Returns the globally (or locally) installed `sharp` instance.
 * This method will throw errors if the `sharp` instance cannot be found, these errors can be circumvented by ensuring `isAvailableAsync()` resolves to `true`.
 */
export async function findSharpInstanceAsync(): Promise<typeof import('sharp')> {
  if (env.EXPO_IMAGE_UTILS_NO_SHARP) {
    throw new Error(
      'Global instance of sharp cannot be retrieved because sharp has been disabled with the environment variable `EXPO_IMAGE_UTILS_NO_SHARP`'
    );
  }

  const sharp = await findSharpModuleAsync();
  if (!sharp) {
    throw new Error(`Failed to find a globally or locally installed "sharp" package.`);
  }

  return sharp;
}

let versionMismatchWarningShown = false;

function showVersionMismatchWarning(requiredVersion: string, installedVersion: string) {
  if (versionMismatchWarningShown) {
    return;
  }
  console.warn(
    [
      chalk.yellow(
        `Expo supports version "${requiredVersion}" of \`sharp\`, current version: "${installedVersion}".`
      ),
      chalk.yellow.dim(
        `If you can remove or upgrade using \`npm (un)install -g sharp@${requiredVersion}\`.`
      ),
      chalk.yellow.dim(`Or disable \`sharp\` with \`EXPO_IMAGE_UTILS_NO_SHARP=1\`.`),
    ].join('\n')
  );
  versionMismatchWarningShown = true;
}
