"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evalModule = evalModule;
exports.loadModule = loadModule;
exports.loadModuleSync = loadModuleSync;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function nodeModule() {
  const data = _interopRequireWildcard(require("node:module"));
  nodeModule = function () {
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
function _nodeUrl() {
  const data = _interopRequireDefault(require("node:url"));
  _nodeUrl = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let ts;
function loadTypescript() {
  if (ts === undefined) {
    try {
      ts = require('typescript');
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      } else {
        ts = null;
      }
    }
  }
  return ts;
}
const parent = module;
const tsExtensionMapping = {
  '.ts': '.js',
  '.cts': '.cjs',
  '.mts': '.mjs'
};
function toFormat(filename) {
  if (filename.endsWith('.cjs')) {
    return 'commonjs';
  } else if (filename.endsWith('.mjs')) {
    return 'module';
  } else if (filename.endsWith('.js')) {
    return undefined;
  } else if (filename.endsWith('.mts')) {
    return 'module-typescript';
  } else if (filename.endsWith('.cts')) {
    return 'commonjs-typescript';
  } else if (filename.endsWith('.ts')) {
    return 'typescript';
  } else {
    return undefined;
  }
}
function isTypescriptFilename(filename) {
  switch (toFormat(filename)) {
    case 'module-typescript':
    case 'commonjs-typescript':
    case 'typescript':
      return true;
    default:
      return false;
  }
}
function compileModule(code, filename, opts) {
  const format = toFormat(filename);
  const prependPaths = opts.paths ?? [];
  const nodeModulePaths = nodeModule()._nodeModulePaths(_nodePath().default.dirname(filename));
  const paths = [...prependPaths, ...nodeModulePaths];
  try {
    const mod = Object.assign(new (nodeModule().Module)(filename, parent), {
      filename,
      paths
    });
    mod._compile(code, filename, format);
    require.cache[filename] = mod;
    parent?.children?.splice(parent.children.indexOf(mod), 1);
    return mod.exports;
  } catch (error) {
    delete require.cache[filename];
    throw error;
  }
}
const hasStripTypeScriptTypes = typeof nodeModule().stripTypeScriptTypes === 'function';
function evalModule(code, filename, opts = {}) {
  let inputCode = code;
  let inputFilename = filename;
  if (filename.endsWith('.ts') || filename.endsWith('.cts') || filename.endsWith('.mts')) {
    const ext = _nodePath().default.extname(filename);
    const ts = loadTypescript();
    if (ts) {
      const output = ts.transpileModule(code, {
        fileName: filename,
        reportDiagnostics: false,
        compilerOptions: {
          module: ext === '.cts' ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          target: ts.ScriptTarget.ESNext,
          newLine: ts.NewLineKind.LineFeed,
          inlineSourceMap: true
        }
      });
      inputCode = output ? output.outputText : inputCode;
    }
    if (hasStripTypeScriptTypes && inputCode === code) {
      inputCode = nodeModule().stripTypeScriptTypes(code, {
        mode: 'transform',
        sourceMap: true
      });
    }
    if (inputCode !== code) {
      const inputExt = tsExtensionMapping[ext] ?? ext;
      if (inputExt !== ext) {
        inputFilename = _nodePath().default.join(_nodePath().default.dirname(filename), _nodePath().default.basename(filename, ext) + inputExt);
      }
    }
  }
  const mod = compileModule(inputCode, inputFilename, opts);
  if (inputFilename !== filename) {
    require.cache[filename] = mod;
  }
  return mod;
}
async function requireOrImport(filename) {
  try {
    return require(filename);
  } catch {
    return await Promise.resolve(`${_nodePath().default.isAbsolute(filename) ? _nodeUrl().default.pathToFileURL(filename).toString() : filename}`).then(s => _interopRequireWildcard(require(s)));
  }
}
async function loadModule(filename) {
  try {
    return await requireOrImport(filename);
  } catch (error) {
    if (error.code === 'ERR_UNKNOWN_FILE_EXTENSION' && isTypescriptFilename(filename)) {
      const code = await _nodeFs().default.promises.readFile(filename, 'utf8');
      return evalModule(code, filename);
    } else {
      throw error;
    }
  }
}

/** Require module or evaluate with TypeScript
 * NOTE: Requiring ESM has been added in all LTS versions (Node 20.19+, 22.12+, 24).
 * This already forms the minimum required Node version as of Expo SDK 54 */
function loadModuleSync(filename) {
  try {
    if (!isTypescriptFilename(filename)) {
      return require(filename);
    }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw error;
    }
    // We fallback to always evaluating the entrypoint module
    // This is out of safety, since we're not trusting the requiring ESM feature
    // and evaluating the module manually bypasses the error when it's flagged off
  }
  const code = _nodeFs().default.readFileSync(filename, 'utf8');
  return evalModule(code, filename);
}
//# sourceMappingURL=load.js.map