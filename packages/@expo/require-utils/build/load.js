"use strict";

exports.__esModule = true;
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
function _nodeVm() {
  const data = _interopRequireDefault(require("node:vm"));
  _nodeVm = function () {
    return data;
  };
  return data;
}
function _codeframe() {
  const data = require("./codeframe");
  _codeframe = function () {
    return data;
  };
  return data;
}
function _transform() {
  const data = require("./transform");
  _transform = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let _ts;
function loadTypescript() {
  if (_ts === undefined) {
    try {
      _ts = require('typescript');
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      } else {
        _ts = null;
      }
    }
  }
  return _ts;
}
const parent = module;
const tsExtensionMapping = {
  '.ts': '.js',
  '.cts': '.cjs',
  '.mts': '.mjs'
};
function maybeReadFileSync(filename) {
  try {
    return _nodeFs().default.readFileSync(filename, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
function toFormat(filename, isLegacy) {
  let mode;
  let legacy = false;
  if (filename.endsWith('.cjs')) {
    mode = 'commonjs';
  } else if (filename.endsWith('.mjs')) {
    mode = 'module';
  } else if (filename.endsWith('.js')) {
    legacy = isLegacy;
    mode = isLegacy ? 'commonjs' : undefined;
  } else if (filename.endsWith('.mts')) {
    mode = 'module-typescript';
  } else if (filename.endsWith('.cts')) {
    mode = 'commonjs-typescript';
  } else if (filename.endsWith('.ts')) {
    legacy = isLegacy;
    mode = isLegacy ? 'commonjs-typescript' : 'typescript';
  }
  return {
    mode,
    legacy
  };
}
function toRealDirname(filePath) {
  let normalized = _nodePath().default.resolve(filePath);
  // Try resolving the filename itself first
  try {
    normalized = _nodeFs().default.realpathSync(normalized);
    return _nodePath().default.dirname(normalized);
  } catch (error) {
    normalized = _nodePath().default.dirname(normalized);
    // If we're getting another error than an ENOENT, return the dirname unchanged
    if (error?.code !== 'ENOENT') {
      return normalized;
    }
  }
  // Alternatively, if it's a fake path, resolve the directory directly instead
  try {
    return _nodeFs().default.realpathSync(normalized);
  } catch {
    return normalized;
  }
}
function compileModule(code, filename, opts) {
  const format = toFormat(filename, false);
  const prependPaths = opts.paths ?? [];
  // See: https://github.com/nodejs/node/blob/ff080948666f28fbd767548d26bea034d30bc277/lib/internal/modules/cjs/loader.js#L767
  // If we get a symlinked path instead of the realpath, we assume the realpath is needed for Node module resolution
  const basePath = toRealDirname(filename);
  const nodeModulePaths = nodeModule()._nodeModulePaths(basePath);
  const paths = [...prependPaths, ...nodeModulePaths];
  try {
    const mod = Object.assign(new (nodeModule().Module)(filename, parent), {
      filename,
      paths
    });
    mod._compile(code, filename, format.mode);
    mod.loaded = true;
    require.cache[filename] = mod;
    parent?.children?.splice(parent.children.indexOf(mod), 1);
    return mod;
  } catch (error) {
    delete require.cache[filename];
    throw error;
  }
}
function containsModuleSyntax(code) {
  // Fast-path: We can assume that if there's no ESM keyword, we don't need to check at all
  if (!/\b(?:import|export|await)\b/.test(code)) {
    return false;
  }
  try {
    const CJS_WRAP_PARAMS = ['exports', 'require', 'module', '__filename', '__dirname'];
    _nodeVm().default.compileFunction(code, CJS_WRAP_PARAMS);
    return false;
  } catch {
    return true;
  }
}
const hasStripTypeScriptTypes = typeof nodeModule().stripTypeScriptTypes === 'function';
function evalModule(code, filename, opts = {}, format = toFormat(filename, true)) {
  let inputCode = code;
  let inputFilename = filename;
  let diagnostic;
  if (format.mode === 'typescript' || format.mode === 'module-typescript' || format.mode === 'commonjs-typescript') {
    const ts = loadTypescript();
    if (ts) {
      let module;
      if (format.mode === 'commonjs-typescript') {
        module = ts.ModuleKind.CommonJS;
      } else if (format.mode === 'module-typescript') {
        module = ts.ModuleKind.ESNext;
      } else {
        // NOTE(@kitten): We can "preserve" the output, meaning, it can either be ESM or CJS
        // and stop TypeScript from either transpiling it to CommonJS or adding an `export {}`
        // if no exports are used. This allows the user to choose if this file is CJS or ESM
        // (but not to mix both)
        module = ts.ModuleKind.Preserve;
      }
      const output = ts.transpileModule(code, {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: {
          module,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          // `verbatimModuleSyntax` needs to be off, to erase as many imports as possible
          verbatimModuleSyntax: false,
          target: ts.ScriptTarget.ESNext,
          newLine: ts.NewLineKind.LineFeed,
          inlineSourceMap: true,
          esModuleInterop: true
        }
      });
      inputCode = output?.outputText || inputCode;
      if (output?.diagnostics?.length) {
        diagnostic = output.diagnostics[0];
      }
    }
    if (hasStripTypeScriptTypes && inputCode === code) {
      // This may throw its own error, but this contains a code-frame already
      inputCode = nodeModule().stripTypeScriptTypes(code, {
        mode: 'transform',
        sourceMap: true
      });
    }
    if (inputCode !== code) {
      const ext = _nodePath().default.extname(filename);
      const inputExt = tsExtensionMapping[ext] ?? ext;
      if (inputExt !== ext) {
        inputFilename = _nodePath().default.join(_nodePath().default.dirname(filename), _nodePath().default.basename(filename, ext) + inputExt);
      }
    }
  } else if (format.mode === 'commonjs') {
    inputCode = (0, _transform().toCommonJS)(filename, code);
  }

  // NOTE(@kitten): If we've transpiling to CommonJS ourselves above, we should check if
  // the output contains module syntax, which prevents us from loading this file as CommonJS.
  // If it does, we run the non-legacy ESM code path instead
  if (format.legacy && (format.mode === 'commonjs' || format.mode === 'commonjs-typescript') && containsModuleSyntax(inputCode)) {
    format = toFormat(filename, false);
    return evalModule(code, filename, opts, format);
  }
  try {
    const mod = compileModule(inputCode, inputFilename, opts);
    if (inputFilename !== filename) {
      require.cache[filename] = mod;
    }
    return mod.exports;
  } catch (error) {
    // If we have a diagnostic from TypeScript, we issue its error with a codeframe first,
    // since it's likely more useful than the eval error
    const diagnosticError = (0, _codeframe().formatDiagnostic)(diagnostic);
    if (diagnosticError) {
      throw diagnosticError;
    }
    throw (0, _codeframe().annotateError)(code, filename, error) ?? error;
  }
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
    if (error.code === 'ERR_UNKNOWN_FILE_EXTENSION' || error.code === 'MODULE_NOT_FOUND') {
      return loadModuleSync(filename);
    } else {
      throw error;
    }
  }
}

/** Require module or evaluate with TypeScript
 * NOTE: Requiring ESM has been added in all LTS versions (Node 20.19+, 22.12+, 24).
 * This already forms the minimum required Node version as of Expo SDK 54 */
function loadModuleSync(filename) {
  const format = toFormat(filename, true);
  const isTypeScript = format.mode === 'module-typescript' || format.mode === 'commonjs-typescript' || format.mode === 'typescript';
  try {
    if (format.mode !== 'module' && !isTypeScript) {
      return require(filename);
    }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw error;
    } else if (format.mode == null) {
      const code = maybeReadFileSync(filename);
      throw (0, _codeframe().annotateError)(code, filename, error) || error;
    }
    // We fallback to always evaluating the entrypoint module
    // This is out of safety, since we're not trusting the requiring ESM feature
    // and evaluating the module manually bypasses the error when it's flagged off
  }

  // Load from cache manually, if `loaded` is set and exports are defined, to avoid
  // double transform or double evaluation
  if (require.cache[filename]?.exports && require.cache[filename].loaded) {
    return require.cache[filename].exports;
  }
  const code = _nodeFs().default.readFileSync(filename, 'utf8');
  return evalModule(code, filename, {}, format);
}
//# sourceMappingURL=load.js.map