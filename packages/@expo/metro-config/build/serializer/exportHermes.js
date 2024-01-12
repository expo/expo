"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildHermesBundleAsync = buildHermesBundleAsync;
function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));
  _spawnAsync = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
    return data;
  };
  return data;
}
function _metroSourceMap() {
  const data = require("metro-source-map");
  _metroSourceMap = function () {
    return data;
  };
  return data;
}
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _process() {
  const data = _interopRequireDefault(require("process"));
  _process = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = require('debug')('expo:metro:hermes');
function importHermesCommandFromProject() {
  const platformExecutable = getHermesCommandPlatform();
  const hermescLocations = [
  // Override hermesc dir by environment variables
  _process().default.env['REACT_NATIVE_OVERRIDE_HERMES_DIR'] ? `${_process().default.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']}/build/bin/hermesc` : '',
  // Building hermes from source
  'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc',
  // Prebuilt hermesc in official react-native 0.69+
  `react-native/sdks/hermesc/${platformExecutable}`,
  // Legacy hermes-engine package
  `hermes-engine/${platformExecutable}`];
  for (const location of hermescLocations) {
    try {
      return require.resolve(location);
    } catch {}
  }
  throw new Error('Cannot find the hermesc executable.');
}
function getHermesCommandPlatform() {
  switch (_os().default.platform()) {
    case 'darwin':
      return 'osx-bin/hermesc';
    case 'linux':
      return 'linux64-bin/hermesc';
    case 'win32':
      return 'win64-bin/hermesc.exe';
    default:
      throw new Error(`Unsupported host platform for Hermes compiler: ${_os().default.platform()}`);
  }
}
// Only one hermes build at a time is supported.
let currentHermesBuild = null;
async function buildHermesBundleAsync(options) {
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
  filename
}) {
  const tempDir = _path().default.join(_os().default.tmpdir(), `expo-bundler-${Math.random()}-${Date.now()}`);
  await _fsExtra().default.ensureDir(tempDir);
  try {
    const tempBundleFile = _path().default.join(tempDir, 'index.js');
    await _fsExtra().default.writeFile(tempBundleFile, code);
    if (map) {
      const tempSourcemapFile = _path().default.join(tempDir, 'index.js.map');
      await _fsExtra().default.writeFile(tempSourcemapFile, map);
    }
    const tempHbcFile = _path().default.join(tempDir, 'index.hbc');
    const hermesCommand = importHermesCommandFromProject();
    const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile];
    if (minify) {
      args.push('-O');
    }
    if (map) {
      args.push('-output-source-map');
    }
    debug(`Running hermesc: ${hermesCommand} ${args.join(' ')}`);
    await (0, _spawnAsync().default)(hermesCommand, args);
    let hbc;
    let sourcemap = null;
    if (!map) {
      hbc = await _fsExtra().default.readFile(tempHbcFile);
    } else {
      [hbc, sourcemap] = await Promise.all([_fsExtra().default.readFile(tempHbcFile), createHermesSourcemapAsync(map, `${tempHbcFile}.map`)]);
    }
    return {
      hbc,
      sourcemap
    };
  } catch (error) {
    console.error(_chalk().default.red(`\nFailed to generate Hermes bytecode for: ${filename}`));
    if ('status' in error) {
      console.error(error.output.join('\n'));
    }
    throw error;
  } finally {
    await _fsExtra().default.remove(tempDir);
  }
}
async function createHermesSourcemapAsync(sourcemap, hermesMapFile) {
  const bundlerSourcemap = JSON.parse(sourcemap);
  const hermesSourcemap = await _fsExtra().default.readJSON(hermesMapFile);
  return JSON.stringify((0, _metroSourceMap().composeSourceMaps)([bundlerSourcemap, hermesSourcemap]));
}
//# sourceMappingURL=exportHermes.js.map