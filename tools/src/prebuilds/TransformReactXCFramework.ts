/**
 * Prepares VFS overlay and staging directory for stock React.xcframework.
 *
 * The stock Maven-distributed xcframework is left completely untouched
 * (preserving Meta's code signature). Instead:
 * 1. A VFS overlay maps import paths to flat header locations in the stock xcframework
 * 2. Missing headers (from RN source subspecs) are staged in a separate directory
 */

import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';
import { getHeaderFilesFromPodspecs, PodspecHeaderMappings } from './ReactHeaderMappings';
import { createVFSOverlay } from './ReactVFSOverlay';
import { VersionStamp } from './VersionStamp';

interface TransformOptions {
  /** Path to the directory containing React.xcframework */
  outputPath: string;
  /** Path to node_modules/react-native source tree */
  reactNativePath: string;
}

/**
 * Prepares VFS overlay and extra headers for stock React.xcframework.
 * The xcframework itself is never modified — preserving Meta's code signature.
 *
 * Steps:
 * 1. Parse podspecs from RN source -> get header mappings
 * 2. Inventory which headers exist in the stock xcframework (flat layout)
 * 3. Copy missing headers to staging directory (React-extra-headers/)
 * 4. Generate VFS overlay template (pointing to flat stock + staging dir)
 */
export async function transformReactXCFrameworkAsync(options: TransformOptions): Promise<void> {
  const { outputPath, reactNativePath } = options;
  const xcframeworkPath = path.join(outputPath, 'React.xcframework');

  if (!fs.existsSync(xcframeworkPath)) {
    throw new Error(`React.xcframework not found at: ${xcframeworkPath}`);
  }
  if (!fs.existsSync(reactNativePath)) {
    throw new Error(`react-native source not found at: ${reactNativePath}`);
  }

  const headersDir = path.join(xcframeworkPath, 'Headers');
  if (!fs.existsSync(headersDir)) {
    throw new Error(`Headers directory not found in xcframework: ${headersDir}`);
  }

  // RN 0.85+ ships React-VFS-template.yaml inside the xcframework with fully nested headers.
  // When present, use it directly instead of generating our own.
  const bundledTemplatePath = path.join(xcframeworkPath, 'React-VFS-template.yaml');
  if (fs.existsSync(bundledTemplatePath)) {
    logger.verbose('  Using bundled React-VFS-template.yaml from xcframework (RN 0.85+)');

    // Copy bundled template to expected location (where resolveVFSOverlayTemplate reads it)
    fs.copyFileSync(bundledTemplatePath, path.join(outputPath, 'React-VFS-template.yaml'));

    // Clean up stale staging directory (no longer needed with bundled nested headers)
    const stagingDir = path.join(outputPath, 'React-extra-headers');
    if (fs.existsSync(stagingDir)) {
      fs.removeSync(stagingDir);
      logger.verbose('  Removed stale React-extra-headers/ directory');
    }

    // Write version stamp for cache invalidation
    const rnVersion = JSON.parse(
      fs.readFileSync(path.join(reactNativePath, 'package.json'), 'utf8')
    ).version;
    VersionStamp.write(outputPath, { reactNativeVersion: rnVersion }, VFS_STAMP_FILENAME);

    logger.verbose('  VFS overlay setup complete (using bundled template).');
    return;
  }

  logger.verbose('  Collecting header mappings from podspecs...');
  const headerMappings = getHeaderFilesFromPodspecs(reactNativePath);

  logger.verbose('  Inventorying stock xcframework headers...');
  const stockHeaders = inventoryStockHeaders(xcframeworkPath);

  logger.verbose('  Detecting duplicate header basenames...');
  const duplicateBasenames = findDuplicateBasenames(headerMappings);

  logger.verbose('  Staging missing headers to React-extra-headers/...');
  await stageMissingHeadersAsync(outputPath, headerMappings, stockHeaders, duplicateBasenames);

  logger.verbose('  Generating VFS overlay template...');
  const vfsYaml = createVFSOverlay(reactNativePath, stockHeaders, duplicateBasenames);
  fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), vfsYaml);

  // Write a version stamp so we can detect when RN source changes and regenerate
  const rnVersion = JSON.parse(
    fs.readFileSync(path.join(reactNativePath, 'package.json'), 'utf8')
  ).version;
  VersionStamp.write(outputPath, { reactNativeVersion: rnVersion }, VFS_STAMP_FILENAME);

  logger.verbose('  VFS overlay generation complete (xcframework untouched).');
}

/**
 * Inventories headers present in the stock xcframework's flat layout.
 * Returns a map of podSpecName -> Set of header basenames.
 *
 * Stock layout: Headers/Yoga/Style.h, Headers/React_Core/RCTBridge.h, etc.
 */
function inventoryStockHeaders(xcframeworkPath: string): Map<string, Set<string>> {
  const headersDir = path.join(xcframeworkPath, 'Headers');
  const result = new Map<string, Set<string>>();

  const podDirs = fs.readdirSync(headersDir, { withFileTypes: true });
  for (const podDir of podDirs) {
    if (!podDir.isDirectory()) {
      continue;
    }

    const basenames = new Set<string>();
    const podPath = path.join(headersDir, podDir.name);
    const files = fs.readdirSync(podPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.h')) {
        basenames.add(file.name);
      }
    }
    result.set(podDir.name, basenames);
  }

  return result;
}

/**
 * Finds header basenames that appear more than once within the same pod.
 * These cannot use the stock flat layout (which only has one file per basename)
 * and must be staged from source with their full nested paths.
 *
 * Example: Yoga has both yoga/enums/FlexDirection.h and yoga/algorithm/FlexDirection.h
 */
function findDuplicateBasenames(headerMappings: PodspecHeaderMappings): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_podspecPath, headerMaps] of Object.entries(headerMappings)) {
    const podSpecName = headerMaps[0].specName.replace(/-/g, '_');
    const basenameCount = new Map<string, number>();

    for (const headerMap of headerMaps) {
      for (const header of headerMap.headers) {
        const basename = path.basename(header.target);
        basenameCount.set(basename, (basenameCount.get(basename) || 0) + 1);
      }
    }

    const duplicates = new Set<string>();
    for (const [basename, count] of basenameCount) {
      if (count > 1) {
        duplicates.add(basename);
      }
    }

    if (duplicates.size > 0) {
      result.set(podSpecName, duplicates);
    }
  }

  return result;
}

/**
 * Stages headers into a separate directory next to the xcframework.
 * A header needs staging if:
 * - It's missing from the stock xcframework (e.g., subspec headers like Network, Linking)
 * - Its basename collides with another header in the same pod (e.g., Yoga's
 *   enums/FlexDirection.h vs algorithm/FlexDirection.h — the flat layout can only have one)
 *
 * Staging layout: React-extra-headers/<podSpecName>/<target path>
 */
async function stageMissingHeadersAsync(
  outputPath: string,
  headerMappings: PodspecHeaderMappings,
  stockHeaders: Map<string, Set<string>>,
  duplicateBasenames: Map<string, Set<string>>
): Promise<void> {
  const stagingDir = path.join(outputPath, 'React-extra-headers');

  // Clear existing staging dir for a clean slate
  if (fs.existsSync(stagingDir)) {
    fs.removeSync(stagingDir);
  }

  let stagedCount = 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_podspecPath, headerMaps] of Object.entries(headerMappings)) {
    const podSpecName = headerMaps[0].specName.replace(/-/g, '_');
    const podStockHeaders = stockHeaders.get(podSpecName) || new Set<string>();
    const podDuplicates = duplicateBasenames.get(podSpecName) || new Set<string>();

    for (const headerMap of headerMaps) {
      for (const header of headerMap.headers) {
        const basename = path.basename(header.target);
        const needsStaging = !podStockHeaders.has(basename) || podDuplicates.has(basename);

        if (needsStaging) {
          const stagingPath = path.join(stagingDir, podSpecName, header.target);
          fs.ensureDirSync(path.dirname(stagingPath));

          if (fs.existsSync(header.source)) {
            fs.copyFileSync(header.source, stagingPath);
            stagedCount++;
          }
        }
      }
    }
  }

  logger.verbose(`  Staged ${stagedCount} missing headers to React-extra-headers/`);
}

const VFS_STAMP_FILENAME = '.vfs-version-stamp';

/**
 * Checks if VFS overlay has already been generated for this output directory
 * and matches the current react-native source version.
 *
 * When reactNativeSourcePath is provided, also verifies the stored version stamp
 * matches the current RN package version — preventing stale VFS after RN upgrades.
 */
export function isVFSGenerated(outputPath: string, reactNativeSourcePath?: string): boolean {
  const templateExists = fs.existsSync(path.join(outputPath, 'React-VFS-template.yaml'));
  if (!templateExists) return false;

  // If no source path provided, just check file existence (backwards compat)
  if (!reactNativeSourcePath) return true;

  const currentVersion = JSON.parse(
    fs.readFileSync(path.join(reactNativeSourcePath, 'package.json'), 'utf8')
  ).version;

  return VersionStamp.isUpToDate(
    outputPath,
    { reactNativeVersion: currentVersion },
    VFS_STAMP_FILENAME
  );
}
