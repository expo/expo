import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';
import { BuildFlavor } from './Prebuilder.types';
import { findDsymForSlice } from './dSYM';

/**
 * Strips local symbols from the product binary of each Release slice that has a dSYM in the
 * xcframework. The dSYM keeps the symbols for symbolication. Debug xcframeworks are left as is.
 * Must run after the slice contents are final and before the xcframework is signed.
 */
export async function stripReleaseSymbolsAsync(
  xcframeworkPath: string,
  productName: string,
  slices: string[],
  buildType: BuildFlavor
): Promise<void> {
  if (buildType !== 'Release') {
    return;
  }
  for (const slice of slices) {
    if (findDsymForSlice(xcframeworkPath, slice, productName)) {
      await stripLocalSymbolsAsync(
        path.join(xcframeworkPath, slice, `${productName}.framework`),
        productName
      );
    }
  }
}

/**
 * Strips local symbols from a framework's binary. A framework that was signed is re-signed
 * ad hoc so its seal stays valid.
 */
async function stripLocalSymbolsAsync(frameworkPath: string, binaryName: string): Promise<void> {
  const binaryPath = await fs.realpath(path.join(frameworkPath, binaryName));
  const wasSigned = await isSignedAsync(frameworkPath);

  logger.verbose(`✂️  Stripping local symbols from ${binaryPath}`);
  try {
    await spawnAsync('xcrun', ['strip', '-x', binaryPath]);
  } catch (error) {
    const stderr = (error as Partial<spawnAsync.SpawnResult>).stderr?.trim();
    throw new Error(
      `Failed to strip local symbols from ${binaryPath}: ${stderr || String(error)}\n` +
        `The binary is not a valid Mach-O file, or the strip tool is missing. Check that the ` +
        `Xcode command line tools are selected (\`xcrun --find strip\`), then run the build again.`
    );
  }

  if (wasSigned) {
    logger.verbose(`🔏 Re-signing ad hoc: ${frameworkPath}`);
    try {
      await spawnAsync('codesign', ['--force', '--sign', '-', frameworkPath]);
    } catch (error) {
      const stderr = (error as Partial<spawnAsync.SpawnResult>).stderr?.trim();
      throw new Error(
        `Failed to re-sign ${frameworkPath} ad hoc after stripping its symbols: ${stderr || String(error)}\n` +
          `The strip changed the binary, so its old signature is no longer valid. Run ` +
          `\`codesign --verify --strict ${frameworkPath}\` to see what codesign rejects, then run the build again.`
      );
    }
  }
}

async function isSignedAsync(frameworkPath: string): Promise<boolean> {
  try {
    await spawnAsync('codesign', ['-d', frameworkPath], { ignoreStdio: true });
    return true;
  } catch {
    return false;
  }
}
