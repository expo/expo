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

  logger.info('  Collecting header mappings from podspecs...');
  const headerMappings = getHeaderFilesFromPodspecs(reactNativePath);

  logger.info('  Inventorying stock xcframework headers...');
  const stockHeaders = inventoryStockHeaders(xcframeworkPath);

  logger.info('  Detecting duplicate header basenames...');
  const duplicateBasenames = findDuplicateBasenames(headerMappings);

  logger.info('  Staging missing headers to React-extra-headers/...');
  await stageMissingHeadersAsync(outputPath, headerMappings, stockHeaders, duplicateBasenames);

  logger.info('  Generating VFS overlay template...');
  const vfsYaml = createVFSOverlay(reactNativePath, stockHeaders, duplicateBasenames);
  fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), vfsYaml);

  logger.info('  VFS overlay generation complete (xcframework untouched).');
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

  logger.info(`  Staged ${stagedCount} missing headers to React-extra-headers/`);
}

/**
 * Checks if VFS overlay has already been generated for this output directory.
 * A generated setup will have a React-VFS-template.yaml file next to the xcframework.
 */
export function isVFSGenerated(outputPath: string): boolean {
  return fs.existsSync(path.join(outputPath, 'React-VFS-template.yaml'));
}
