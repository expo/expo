"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveGlobal = void 0;
function _nodeChild_process() {
  const data = require("node:child_process");
  _nodeChild_process = function () {
    return data;
  };
  return data;
}
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
function _nodeOs() {
  const data = _interopRequireDefault(require("node:os"));
  _nodeOs = function () {
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
const memoize = fn => {
  let result;
  return (...args) => {
    if (result === undefined) {
      result = {
        value: fn(...args)
      };
    }
    return result.value;
  };
};
const isWindows = process.platform === 'win32';
const getDelimitedPaths = delimited => delimited.split(_nodePath().default.delimiter).map(target => {
  try {
    const normalized = _nodePath().default.normalize(target.trim());
    if (!normalized) {
      return null;
    } else if (!_nodePath().default.isAbsolute(normalized)) {
      return _nodePath().default.resolve(process.cwd(), normalized);
    } else {
      return normalized;
    }
  } catch {
    return null;
  }
}).filter(target => !!target);
const execGetPaths = (cmd, args) => {
  const result = (0, _nodeChild_process().spawnSync)(cmd, args, {
    encoding: 'utf8'
  });
  if (!result.error && result.status === 0 && result.stdout) {
    const paths = getDelimitedPaths(result.stdout.replace(/[\r\n]+/g, _nodePath().default.delimiter));
    return paths.filter(target => _nodeFs().default.existsSync(target));
  }
  return [];
};
const getNativeNodePaths = () => {
  if (Array.isArray(_nodeModule().default.globalPaths)) {
    return _nodeModule().default.globalPaths;
  } else {
    return [];
  }
};
const getHomePath = memoize(() => {
  try {
    return _nodeOs().default.homedir();
  } catch {
    return isWindows ? process.env.UserProfile ?? process.env.USERPROFILE : process.env.HOME;
  }
});
const getNpmDefaultPaths = () => {
  const prefix = [];
  const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
  if (isWindows && localAppData) {
    prefix.push(_nodePath().default.resolve(localAppData, 'npm'));
  } else if (!isWindows) {
    prefix.push('/usr/local/lib/node_modules');
  }
  return prefix.filter(target => _nodeFs().default.existsSync(target));
};
const getNpmPrefixPaths = memoize(() => {
  const npmPrefix = execGetPaths(isWindows ? 'npm.cmd' : 'npm', ['config', '-g', 'get', 'prefix']);
  return npmPrefix.map(prefix => _nodePath().default.resolve(prefix, 'lib'));
});
const getYarnDefaultPaths = () => {
  const prefix = [];
  const homePath = getHomePath();
  const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
  const dataHomePath = process.env.XDG_DATA_HOME || homePath && _nodePath().default.join(homePath, '.local', 'share');
  if (isWindows && localAppData) {
    prefix.push(_nodePath().default.resolve(localAppData, 'Yarn', 'global'));
  }
  if (dataHomePath) {
    prefix.push(_nodePath().default.resolve(dataHomePath, 'yarn', 'global'));
  }
  if (homePath) {
    prefix.push(_nodePath().default.resolve(homePath, '.yarn', 'global'));
  }
  return prefix.filter(target => _nodeFs().default.existsSync(target));
};
const getYarnPrefixPaths = memoize(() => {
  return execGetPaths(isWindows ? 'yarn.cmd' : 'yarn', ['global', 'dir']);
});
const getPnpmPrefixPaths = memoize(() => {
  return execGetPaths(isWindows ? 'pnpm.cmd' : 'pnpm', ['root', '-g']);
});
const getBunPrefixPaths = memoize(() => {
  const prefix = [];
  const bunPath = execGetPaths(isWindows ? 'bun.cmd' : 'bun', ['pm', 'bin', '-g'])[0];
  if (!bunPath) {
    return [];
  }
  prefix.push(_nodePath().default.resolve(bunPath, 'global'));
  const moduleEntry = _nodeFs().default.readdirSync(bunPath, {
    withFileTypes: true
  }).find(entry => {
    return entry.isSymbolicLink() && entry.name !== 'global';
  });
  if (moduleEntry) {
    try {
      const moduleTarget = _nodeFs().default.realpathSync(_nodePath().default.resolve(bunPath, moduleEntry.name));
      const splitIdx = moduleTarget.indexOf(_nodePath().default.sep + 'node_modules' + _nodePath().default.sep);
      if (splitIdx > -1) {
        const modulePath = moduleTarget.slice(0, splitIdx);
        prefix.push(modulePath);
      }
    } catch {}
  }
  return prefix.filter(target => _nodeFs().default.existsSync(target));
});
const getPaths = () => [...getNpmDefaultPaths(), ...getNpmPrefixPaths(), ...getYarnDefaultPaths(), ...getYarnPrefixPaths(), ...getPnpmPrefixPaths(), ...getBunPrefixPaths(), ...getNativeNodePaths(), process.cwd()];

/** Resolve a globally installed module before a locally installed one */
const resolveGlobal = id => {
  return require.resolve(id, {
    paths: getPaths()
  });
};
exports.resolveGlobal = resolveGlobal;
//# sourceMappingURL=resolveGlobal.js.map