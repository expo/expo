/**
 * VFS (Virtual File System) overlay generation for React Native headers.
 *
 * Ported from react-native's `scripts/ios-prebuild/vfs.js`.
 * Generates a Clang VFS overlay YAML file that maps virtual header paths
 * (matching import paths like <yoga/style/Style.h>) to physical locations
 * in the xcframework's flat header layout.
 */

import path from 'path';

import { getHeaderFilesFromPodspecs } from './ReactHeaderMappings';

const ROOT_PATH_PLACEHOLDER = '${ROOT_PATH}';

interface HeaderMapping {
  key: string;
  path: string;
}

interface VFSFileEntry {
  name: string;
  type: 'file';
  'external-contents': string;
}

interface VFSDirectoryEntry {
  name: string;
  type: 'directory';
  contents: VFSEntry[];
}

type VFSEntry = VFSFileEntry | VFSDirectoryEntry;

interface VFSOverlay {
  version: number;
  'case-sensitive': boolean;
  roots: VFSEntry[];
}

function toPosix(value: string): string {
  return value.split(/[\\/]/).join('/');
}

/**
 * Builds a hierarchical VFS directory structure from a list of header mappings.
 * Clang's VFS overlay requires a tree structure where directories contain their children.
 */
function buildVFSStructure(mappings: HeaderMapping[]): VFSEntry[] {
  // Group files by their directory structure
  const dirTree = new Map<string, Map<string, string>>();

  for (const mapping of mappings) {
    const parts = mapping.key.split('/');
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join('/');

    if (!dirTree.has(dirPath)) {
      dirTree.set(dirPath, new Map());
    }
    const filesMap = dirTree.get(dirPath)!;
    filesMap.set(fileName, mapping.path);
  }

  // Build root-level entries
  const rootDirs = new Set<string>();
  for (const dirPath of dirTree.keys()) {
    const topLevel = dirPath.split('/')[0];
    if (topLevel) {
      rootDirs.add(topLevel);
    }
  }

  const roots: VFSEntry[] = [];

  // Add files at root level (e.g., key === 'RCTAppDelegate.h')
  const rootFiles = dirTree.get('');
  if (rootFiles) {
    for (const [fileName, sourcePath] of Array.from(rootFiles.entries()).sort()) {
      roots.push({
        name: fileName,
        type: 'file',
        'external-contents': toPosix(sourcePath),
      });
    }
  }

  for (const rootDir of Array.from(rootDirs).sort()) {
    const dirEntry = buildDirectoryEntry(rootDir, '', dirTree);
    roots.push(dirEntry);
  }

  return roots;
}

/**
 * Recursively builds a directory entry for the VFS.
 */
function buildDirectoryEntry(
  dirName: string,
  parentPath: string,
  dirTree: Map<string, Map<string, string>>
): VFSEntry {
  const currentPath = parentPath ? `${parentPath}/${dirName}` : dirName;
  const contents: VFSEntry[] = [];

  // Add files in this directory
  const filesInDir = dirTree.get(currentPath);
  if (filesInDir) {
    for (const [fileName, sourcePath] of Array.from(filesInDir.entries()).sort()) {
      contents.push({
        name: fileName,
        type: 'file',
        'external-contents': toPosix(sourcePath),
      });
    }
  }

  // Add subdirectories
  const subdirs = new Set<string>();
  for (const dirPath of dirTree.keys()) {
    if (dirPath.startsWith(currentPath + '/')) {
      const remainder = dirPath.slice(currentPath.length + 1);
      const nextDir = remainder.split('/')[0];
      if (nextDir) {
        subdirs.add(nextDir);
      }
    }
  }

  for (const subdir of Array.from(subdirs).sort()) {
    contents.push(buildDirectoryEntry(subdir, currentPath, dirTree));
  }

  return {
    name: dirName,
    type: 'directory',
    contents,
  };
}

/**
 * Generates YAML for a Clang VFS overlay structure.
 */
function generateVFSOverlayYAML(overlay: VFSOverlay): string {
  let yaml = '';

  yaml += `version: ${String(overlay.version)}\n`;
  yaml += `case-sensitive: ${String(overlay['case-sensitive'])}\n`;
  yaml += `roots:\n`;

  for (const root of overlay.roots) {
    yaml += generateEntryYAML(root, 1);
  }

  return yaml;
}

/**
 * Recursively generates YAML for a VFS entry.
 */
function generateEntryYAML(entry: VFSEntry, indent: number): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  yaml += `${spaces}- name: '${entry.name}'\n`;
  yaml += `${spaces}  type: '${entry.type}'\n`;

  if ('external-contents' in entry && entry['external-contents']) {
    yaml += `${spaces}  external-contents: '${entry['external-contents']}'\n`;
  }

  if ('contents' in entry && entry.contents && entry.contents.length > 0) {
    yaml += `${spaces}  contents:\n`;
    for (const child of entry.contents) {
      yaml += generateEntryYAML(child, indent + 2);
    }
  }

  return yaml;
}

/**
 * Creates a VFS overlay object from the header files in podspecs.
 * Source paths use ${ROOT_PATH} as a placeholder for later replacement.
 *
 * The VFS overlay wraps all header mappings under ${ROOT_PATH}/Headers,
 * which matches the HEADER_SEARCH_PATHS used during SPM builds.
 *
 * When stockHeaders is provided (VFS-only mode), maps to:
 * - Flat basename in stock xcframework for headers with unique basenames
 * - React-extra-headers/ staging dir for missing headers or duplicate basenames
 *   (e.g., Yoga has both enums/FlexDirection.h and algorithm/FlexDirection.h)
 */
function createVFSOverlayContents(
  rootFolder: string,
  stockHeaders?: Map<string, Set<string>>,
  duplicateBasenames?: Map<string, Set<string>>
): VFSOverlay {
  const podSpecsWithHeaderFiles = getHeaderFilesFromPodspecs(rootFolder);

  const mappings: HeaderMapping[] = [];

  Object.keys(podSpecsWithHeaderFiles).forEach((podspecPath) => {
    const headerMaps = podSpecsWithHeaderFiles[podspecPath];
    const podSpecName = headerMaps[0].specName.replace(/-/g, '_');

    headerMaps.forEach((headerMap) => {
      headerMap.headers.forEach((header) => {
        let key = toPosix(header.target);

        // If no headerDir, prefix with podSpecName to avoid collisions
        if (!key.includes('/') && (!headerMap.headerDir || headerMap.headerDir === '')) {
          key = `${podSpecName}/${key}`;
        }

        let sourcePath: string;

        if (stockHeaders) {
          // VFS-only mode: map to flat stock location or staging dir
          const podStockHeaders = stockHeaders.get(podSpecName);
          const podDuplicates = duplicateBasenames?.get(podSpecName);
          const basename = path.basename(header.target);
          const isDuplicate = podDuplicates?.has(basename) ?? false;

          if (!isDuplicate && podStockHeaders && podStockHeaders.has(basename)) {
            // Unique basename exists in stock xcframework — use flat path
            sourcePath = `${ROOT_PATH_PLACEHOLDER}/Headers/${podSpecName}/${basename}`;
          } else {
            // Missing from stock or duplicate basename — use staging directory
            sourcePath = `${ROOT_PATH_PLACEHOLDER}/../React-extra-headers/${podSpecName}/${toPosix(header.target)}`;
          }
        } else {
          // Legacy mode: nested paths (for pre-transformed xcframeworks)
          sourcePath = `${ROOT_PATH_PLACEHOLDER}/Headers/${podSpecName}/${toPosix(header.target)}`;
        }

        mappings.push({ key, path: sourcePath });
      });
    });
  });

  const innerRoots = buildVFSStructure(mappings);

  const wrappedRoot: VFSEntry = {
    name: `${ROOT_PATH_PLACEHOLDER}/Headers`,
    type: 'directory',
    contents: innerRoots,
  };

  return {
    version: 0,
    'case-sensitive': false,
    roots: [wrappedRoot],
  };
}

/**
 * Creates a VFS overlay YAML string from the React Native source tree.
 * This is the main entry point for VFS generation.
 *
 * @param stockHeaders When provided, generates VFS-only overlay mapping to flat
 *   stock xcframework paths + staging dir for missing headers.
 * @param duplicateBasenames Basenames that appear more than once in the same pod.
 *   These must use the staging dir since the flat layout can only have one file per basename.
 */
export function createVFSOverlay(
  rootFolder: string,
  stockHeaders?: Map<string, Set<string>>,
  duplicateBasenames?: Map<string, Set<string>>
): string {
  const overlay = createVFSOverlayContents(rootFolder, stockHeaders, duplicateBasenames);
  return generateVFSOverlayYAML(overlay);
}
