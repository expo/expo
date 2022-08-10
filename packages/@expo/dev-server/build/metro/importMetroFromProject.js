"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.importCliServerApiFromProject = importCliServerApiFromProject;
exports.importExpoMetroConfigFromProject = importExpoMetroConfigFromProject;
exports.importHermesCommandFromProject = importHermesCommandFromProject;
exports.importInspectorProxyServerFromProject = importInspectorProxyServerFromProject;
exports.importMetroConfigFromProject = importMetroConfigFromProject;
exports.importMetroFromProject = importMetroFromProject;
exports.importMetroServerFromProject = importMetroServerFromProject;
exports.importMetroSourceMapComposeSourceMapsFromProject = importMetroSourceMapComposeSourceMapsFromProject;

function _os() {
  const data = _interopRequireDefault(require("os"));

  _os = function () {
    return data;
  };

  return data;
}

function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));

  _resolveFrom = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class MetroImportError extends Error {
  constructor(projectRoot, moduleId) {
    super(`Missing package "${moduleId}" in the project at: ${projectRoot}\n` + 'This usually means `react-native` is not installed. ' + 'Please verify that dependencies in package.json include "react-native" ' + 'and run `yarn` or `npm install`.');
  }

}

function resolveFromProject(projectRoot, moduleId) {
  const resolvedPath = _resolveFrom().default.silent(projectRoot, moduleId);

  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }

  return resolvedPath;
}

function importFromProject(projectRoot, moduleId) {
  return require(resolveFromProject(projectRoot, moduleId));
}

function importMetroSourceMapComposeSourceMapsFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro-source-map/src/composeSourceMaps');
}

function importMetroConfigFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro-config');
}

function importMetroFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro');
}

function importMetroServerFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro/src/Server');
}

function importCliServerApiFromProject(projectRoot) {
  return importFromProject(projectRoot, '@react-native-community/cli-server-api');
}

function importInspectorProxyServerFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro-inspector-proxy');
}

function importExpoMetroConfigFromProject(projectRoot) {
  return importFromProject(projectRoot, '@expo/metro-config');
}

function importHermesCommandFromProject(projectRoot) {
  const platformExecutable = getHermesCommandPlatform();
  const hermescLocations = [// Override hermesc dir by environment variables
  process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR'] ? `${process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']}/build/bin/hermesc` : '', // Building hermes from source
  'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc', // Prebuilt hermesc in official react-native 0.69+
  `react-native/sdks/hermesc/${platformExecutable}`, // Legacy hermes-engine package
  `hermes-engine/${platformExecutable}`];

  for (const location of hermescLocations) {
    try {
      return resolveFromProject(projectRoot, location);
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
//# sourceMappingURL=importMetroFromProject.js.map