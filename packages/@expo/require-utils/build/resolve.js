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
  // We exclude extension resolution, if we're resolving a plain JSON file
  const isJSON = moduleId.endsWith('.json');
  const exts = !isJSON ? params?.extensions ?? Object.keys(_nodeModule().default._extensions) : [];
  const skipNodePath = !!params?.skipNodePath;
  const followSymlinks = params?.followSymlinks ?? skipNodePath;
  let resolved = _nodePath().default.resolve(fromDirectory, moduleId);

  // (1) check direct path / exact match
  const resolveType = resolveTypeSync(resolved);
  if (resolveType === ResolveType.FILE) {
    return resolved;
  }

  // (2) check against direct path matches with extensions
  for (let ext of exts) {
    ext = ext[0] !== '.' ? `.${ext}` : ext;
    const withExt = resolved + ext;
    if (resolveTypeSync(withExt) === ResolveType.FILE) {
      return withExt;
    }
  }
  const isFileSpecifier = /^\.\.?(?:$|[/\\])/.test(moduleId) || _nodePath().default.isAbsolute(moduleId);

  // (2.2) check against `/index` paths if we've disabled Node resolution or if we're resolving a relative path directly
  if ((isFileSpecifier || skipNodePath) && !isJSON && resolveType === ResolveType.DIR) {
    resolved = _nodePath().default.join(resolved, 'index');
    for (let ext of exts) {
      ext = ext[0] !== '.' ? `.${ext}` : ext;
      const withExt = resolved + ext;
      if (resolveTypeSync(withExt) === ResolveType.FILE) {
        // NOTE(@kitten): Like above, we don't resolve symlinks when we're not in a node_modules resolution path
        return withExt;
      }
    }
  }

  // We won't need to continue with Node resolution if we're only resolving paths
  if (isFileSpecifier) {
    return null;
  }

  // (3) if we're not following symlinks, we try to resolve against `node_modules` folders unresolved
  if (!followSymlinks || skipNodePath) {
    const resolvedDir = _nodePath().default.resolve(fromDirectory);
    const moduleDirs = _nodeModule().default._nodeModulePaths(resolvedDir);
    for (const modulesDir of moduleDirs) {
      let candidate = _nodePath().default.join(modulesDir, moduleId);
      const resolveType = resolveTypeSync(candidate);
      // (3.1) direct match
      if (resolveType === ResolveType.FILE) {
        return candidate;
      } else if (resolveType === ResolveType.ENOENT) {
        // Optimization: If the directory itself doesn't exist, there's no point in us continuing
        // to check for more files in this directory
        const dirname = _nodePath().default.dirname(candidate);
        if (dirname !== modulesDir && !_nodeFs().default.existsSync(dirname)) {
          continue;
        }
      }
      // (3.2) check against match with extensions
      for (let ext of exts) {
        ext = ext[0] !== '.' ? `.${ext}` : ext;
        const candidateWithExt = candidate + ext;
        if (resolveTypeSync(candidateWithExt) === ResolveType.FILE) {
          return followSymlinks ? maybeResolve(candidateWithExt) : candidateWithExt;
        }
      }
      // (3.3) check against `/index` paths
      if (!isJSON && resolveType === ResolveType.DIR) {
        candidate = _nodePath().default.join(candidate, 'index');
        for (let ext of exts) {
          ext = ext[0] !== '.' ? `.${ext}` : ext;
          const candidateWithExt = candidate + ext;
          if (resolveTypeSync(candidateWithExt) === ResolveType.FILE) {
            return followSymlinks ? maybeResolve(candidateWithExt) : candidateWithExt;
          }
        }
      }
    }
  }

  // (4): Fallback to native Node resolution, if `skipNodePath` is disabled
  return !skipNodePath ? nativeResolveFrom(fromDirectory, moduleId) : null;
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
function isRealpathFileSync(target) {
  try {
    const realpath = _nodeFs().default.realpathSync(target);
    return !!_nodeFs().default.lstatSync(realpath, {
      throwIfNoEntry: false
    })?.isFile();
  } catch {
    return false;
  }
}
var ResolveType = /*#__PURE__*/function (ResolveType) {
  ResolveType[ResolveType["FILE"] = 1] = "FILE";
  ResolveType[ResolveType["DIR"] = 2] = "DIR";
  ResolveType[ResolveType["ENOENT"] = 0] = "ENOENT";
  return ResolveType;
}(ResolveType || {});
function resolveTypeSync(target) {
  try {
    const stat = _nodeFs().default.lstatSync(target, {
      throwIfNoEntry: false
    });
    if (stat) {
      if (stat.isSymbolicLink()) {
        return isRealpathFileSync(target) ? ResolveType.FILE : ResolveType.ENOENT;
      } else if (stat.isFile()) {
        return ResolveType.FILE;
      } else if (stat.isDirectory()) {
        // NOTE(@kitten): We don't support symlinked directories for resolution
        // Realistically, when we disable Node resolution, symlinked directory resolution
        // for `/index` is rare, and can be used to exploit symlinks
        return ResolveType.DIR;
      } else {
        return ResolveType.ENOENT;
      }
    } else {
      return ResolveType.ENOENT;
    }
  } catch {
    return ResolveType.ENOENT;
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