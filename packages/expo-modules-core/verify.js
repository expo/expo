import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

const SOURCE_HEADERS = '/Users/chrfalch/repos/expo/expo/apps/bare-expo/ios/Pods/Headers';

const REACT_PREBUILT_HEADERS =
  '/Users/chrfalch/repos/expo/expo/packages/expo-modules-core/.dependencies/React-Core-prebuilt/React.xcframework/Headers';

const VFS_PATH =
  '/Users/chrfalch/repos/expo/expo/packages/expo-modules-core/.dependencies/React-Core-prebuilt/React-VFS.yaml';

console.log('Verifying headers...');

const vfsOverlay = fs.readFileSync(VFS_PATH, 'utf8').toLowerCase();

// Walk through all folders in the SOURCE_HEADERS directory, it has two subfolders, Public and Private.
// Start by walking through SOURCE_HEADERS/Public followed by SOURCE_HEADERS/Private.
// For each file, we should search for the corresponding file in the REACT_CORE_HEADERS directory.
// If the file does not exist, we should log an error. Make sure to search and not just check for the existence of the folder.

['Public', 'Private'].forEach((subfolder) => {
  const sourceDir = path.join(SOURCE_HEADERS, subfolder);

  function walkDir(dir) {
    if (
      [
        'libdav1d',
        'libavif',
        'libwebp',
        'folly',
        'boost',
        'SDWebImage',
        'ZXingObjC',
        'react_native_skia',
        'RNWorklets',
        'RNGestureHandler',
        'RNReanimated',
        'React-Core-prebuilt',
        'react-native-slider',
        'react-native-safe-area-context',
        'react-native-webview',
        'react-native-segmented-control',
        'react-native-keyboard-controller',
        'react-native-',
        'RNScreens',
        'RNSvg',
        'Nimble',
        'OHHTTPStubs',
        'Quick',
        'fast_float',
        'SocketRocket',
        'double-conversion',
        'expo',
        'glog',
        'fmt',
        'EAS',
        'EX',
        'UMAppLoader',
        'Reachability',
        'lottie',
        'BenchmarkingModule',
        'hermes-engine',
        'RN',
        'ReactCodegen',
        'ReactAppDependencyProvider',
      ].some((substring) => path.basename(dir.toLowerCase()).startsWith(substring.toLowerCase()))
    ) {
      return;
    }

    const missingHeaders = [];
    const headersNotInVFS = [];

    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        // Perform a glob search for the corresponding file in REACT_CORE_HEADERS
        const filename = path.basename(fullPath);
        if (filename.endsWith('-umbrella.h') || filename.endsWith('.modulemap')) {
          return;
        }
        const searchResults = findFileInDir(REACT_PREBUILT_HEADERS, filename);
        if (searchResults.length === 0) {
          missingHeaders.push(fullPath);
        }

        // Now let's check the vfs file as well
        const pathInVfs = filename.toLowerCase();
        if (!vfsOverlay.includes(pathInVfs)) {
          headersNotInVFS.push(pathInVfs);
        }
      }
    });
    if (missingHeaders.length > 0) {
      console.log(`${path.relative(SOURCE_HEADERS, dir)}:`);
      console.error(`  Missing headers ${missingHeaders.length}`);
      missingHeaders.forEach((header) => {
        console.error(`    - ${path.relative(SOURCE_HEADERS, header)}`);
      });
    }
    if (headersNotInVFS.length > 0) {
      console.log(`${path.relative(SOURCE_HEADERS, dir)}:`);
      console.error(`  Headers not in VFS ${headersNotInVFS.length}`);
      headersNotInVFS.forEach((header) => {
        console.error(`    - ${header}`);
      });
    }
  }

  walkDir(sourceDir);
});

function findFileInDir(dir, filename) {
  const results = glob.sync(`${dir}/**/${filename}`);
  if (results.length > 0) {
    return results;
  }
  return [];
}

console.log('Header verification complete.');
