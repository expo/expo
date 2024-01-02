"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPatchPlugin = createPatchPlugin;
function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));
  _spawnAsync = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
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
function _withMod() {
  const data = require("./withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
function _withRunOnce() {
  const data = require("./withRunOnce");
  _withRunOnce = function () {
    return data;
  };
  return data;
}
function _modules() {
  const data = require("../utils/modules");
  _modules = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DEFAULT_PATCH_ROOT = 'cng-patches';
const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);
const withPatchMod = (config, [platform, props]) => {
  return (0, _withMod().withMod)(config, {
    platform,
    mod: 'patch',
    action: async config => {
      await applyPatchAsync(config.modRequest.projectRoot, platform, props);
      return config;
    }
  });
};
function createPatchPlugin(platform, props = {}) {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const pluginName = `with${platformName}PatchPlugin`;
  const withUnknown = config => {
    return (0, _withRunOnce().withRunOnce)(config, {
      plugin: config => withPatchMod(config, [platform, props]),
      name: pluginName
    });
  };
  Object.defineProperty(withUnknown, 'name', {
    value: pluginName
  });
  return withUnknown;
}
async function applyPatchAsync(projectRoot, platform, props) {
  var _props$patchRoot;
  const patchFilePath = _path().default.join(projectRoot, (_props$patchRoot = props.patchRoot) !== null && _props$patchRoot !== void 0 ? _props$patchRoot : DEFAULT_PATCH_ROOT, `${platform}.patch`);
  const patchExists = await (0, _modules().fileExistsAsync)(patchFilePath);
  if (EXPO_DEBUG) {
    console.log(patchExists ? `[withPatchPlugin] Applying patch from ${patchFilePath}` : `[WithPatchPlugin] No patch found: ${patchFilePath}`);
  }
  if (!patchExists) {
    return;
  }
  try {
    const {
      stdout,
      stderr
    } = await (0, _spawnAsync().default)('git', ['apply', patchFilePath], {
      cwd: projectRoot
    });
    if (EXPO_DEBUG) {
      console.log(`[withPatchPlugin] outputs\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      e.message += `\nGit is required to apply patches. Install Git and try again.`;
    } else if (e.stderr) {
      e.message += `\nstderr:\n${e.stderr}`;
    }
    throw e;
  }
}
//# sourceMappingURL=withPatchPlugin.js.map