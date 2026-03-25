"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveFrom = resolveFrom;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _nodeModule() {
  const data = _interopRequireDefault(require("node:module"));
  _nodeModule = function () {
    return data;
  };
  return data;
}
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function resolveFrom(fromDirectory, moduleId, params) {
  const exts = params?.extensions ?? Object.keys(_nodeModule().default._extensions);
  const resolved = _nodePath().default.resolve(fromDirectory, moduleId);
  // (1) check direct path / exact match
  if (_nodeFs().default.existsSync(resolved)) {
    return resolved;
  }

  // (2) check against direct path matches with extensions
  for (let ext of exts) {
    ext = ext[0] !== '.' ? `.${ext}` : ext;
    const withExt = resolved + ext;
    if (_nodeFs().default.existsSync(withExt)) {
      return withExt;
    }
  }

  // (3) if we're not following symlinks, we try to resolve against `node_modules` folders unresolved
  if (!params?.followSymlinks) {
    const resolvedDir = _nodePath().default.resolve(fromDirectory);
    const moduleDirs = _nodeModule().default._nodeModulePaths(resolvedDir);
    for (const modulesDir of moduleDirs) {
      const candidate = _nodePath().default.join(modulesDir, moduleId);
      // (3.1) direct match
      if (_nodeFs().default.existsSync(candidate)) {
        return candidate;
      }
      // (3.2) check against match with extensions
      for (let ext of exts) {
        ext = ext[0] !== '.' ? `.${ext}` : ext;
        const candidateWithExt = candidate + ext;
        if (_nodeFs().default.existsSync(candidateWithExt)) {
          return candidateWithExt;
        }
      }
    }
  }

  // (4): Fallback to native Node resolution
  return nativeResolveFrom(fromDirectory, moduleId);
}
function nativeResolveFrom(fromDirectory, moduleId) {
  try {
    const resolvedDir = maybeResolve(fromDirectory);
    const fromFile = _nodePath().default.join(resolvedDir, 'index.js');
    return _nodeModule().default._resolveFilename(moduleId, {
      id: fromFile,
      filename: fromFile,
      paths: [..._nodeModule().default._nodeModulePaths(resolvedDir)]
    });
  } catch {
    return null;
  }
}
function maybeResolve(target) {
  target = _nodePath().default.resolve(process.cwd(), target);
  try {
    return _nodeFs().default.realpathSync(target);
  } catch {
    return target;
  }
}
//# sourceMappingURL=resolve.js.map