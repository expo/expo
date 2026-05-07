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
function _nodeUrl() {
  const data = _interopRequireDefault(require("node:url"));
  _nodeUrl = function () {
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
function _stacktrace() {
  const data = require("./stacktrace");
  _stacktrace = function () {
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
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
  if (filename.endsWith('.cjs')) {
    return 'commonjs';
  } else if (filename.endsWith('.mjs')) {
    return 'module';
  } else if (filename.endsWith('.js')) {
    return isLegacy ? 'commonjs' : null;
  } else if (filename.endsWith('.mts')) {
    return 'module-typescript';
  } else if (filename.endsWith('.cts')) {
    return 'commonjs-typescript';
  } else if (filename.endsWith('.ts')) {
    return isLegacy ? 'commonjs-typescript' : 'typescript';
  } else {
    return null;
  }
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
const hasModuleSourceMapsSupport = typeof nodeModule().setSourceMapsSupport === 'function';
function getSourceMapsState() {
  return typeof nodeModule().getSourceMapsSupport === 'function' ? nodeModule().getSourceMapsSupport() : {
    enabled: !!process.sourceMapsEnabled
  };
}
function setSourceMapsState(state) {
  if (hasModuleSourceMapsSupport) {
    nodeModule().setSourceMapsSupport(state.enabled, {
      nodeModules: state.nodeModules ?? false,
      generatedCode: state.generatedCode ?? false
    });
  } else {
    process.setSourceMapsEnabled(state.enabled);
  }
}
function makeSourceMapTempPath(filename) {
  let basename = _nodePath().default.basename(filename);
  const queryIdx = basename.search(/[?#]/);
  if (queryIdx >= 0) {
    basename = basename.slice(0, queryIdx);
  }
  return _nodePath().default.join(_nodeOs().default.tmpdir(), `require-utils-${process.pid}-${basename}.map`);
}
function stripSourceMappingURL(code) {
  return code.replace(/^[ \t]*\/\/[#@][ \t]+sourceMappingURL=.*$/gm, '');
}
function compileModule(code, filename, opts) {
  const format = toFormat(filename, false);
  const prependPaths = opts.paths ?? [];
  // See: https://github.com/nodejs/node/blob/ff080948666f28fbd767548d26bea034d30bc277/lib/internal/modules/cjs/loader.js#L767
  // If we get a symlinked path instead of the realpath, we assume the realpath is needed for Node module resolution
  const basePath = toRealDirname(filename);
  const nodeModulePaths = nodeModule()._nodeModulePaths(basePath);
  const paths = [...prependPaths, ...nodeModulePaths];
  let inputCode = code;

  // We may get a Metro SSR relative path here, which isn't a valid absolute path, and we need to normalize
  // the filename before proceeding
  let compileFilename = filename;
  if (opts.sourceMap) {
    const queryIdx = filename.search(/[?#]/);
    const basePart = queryIdx >= 0 ? filename.slice(0, queryIdx) : filename;
    const queryPart = queryIdx >= 0 ? filename.slice(queryIdx) : '';
    if (!_nodePath().default.isAbsolute(basePart)) {
      compileFilename = _nodePath().default.resolve(basePart) + queryPart;
    }
  }
  let mapPath;
  let priorSourceMapsState;
  if (opts.sourceMap && !process.isBun) {
    try {
      mapPath = makeSourceMapTempPath(compileFilename);
      _nodeFs().default.writeFileSync(mapPath, opts.sourceMap);
    } catch (error) {
      mapPath = undefined;
      // If we fail to write the source map, we can still continue without it, but log a warning since it's likely a misconfiguration
      console.warn(`Warning: Failed to write source map for ${filename} to ${mapPath}. Source maps will be unavailable for this module.\n${error?.message || error}`);
    }
    if (mapPath) {
      inputCode = stripSourceMappingURL(code);
      // NOTE This needs to be a plain absolute path because Node rejects file: URLs
      inputCode += `\n//# sourceMappingURL=${mapPath}`;
      priorSourceMapsState = getSourceMapsState();
      (0, _stacktrace().installSourceMapStackTrace)();
      setSourceMapsState({
        enabled: true,
        nodeModules: true
      });
    }
  }
  try {
    const mod = Object.assign(new (nodeModule().Module)(compileFilename, parent), {
      filename: compileFilename,
      paths
    });
    mod._compile(inputCode, compileFilename, format != null ? format : undefined);
    mod.loaded = true;
    require.cache[compileFilename] = mod;
    if (compileFilename !== filename) {
      require.cache[filename] = mod;
    }
    parent?.children?.splice(parent.children.indexOf(mod), 1);
    return mod;
  } catch (error) {
    delete require.cache[compileFilename];
    if (compileFilename !== filename) {
      delete require.cache[filename];
    }
    throw error;
  } finally {
    if (mapPath) {
      // Restore, so subsequent requires of node_modules won't have their source-maps read
      setSourceMapsState(priorSourceMapsState ?? {
        enabled: false
      });
      // Node parses source maps eagerly during _compile, so the file can be removed now.
      try {
        _nodeFs().default.unlinkSync(mapPath);
      } catch {
        /* noop */
      }
    }
  }
}
const hasStripTypeScriptTypes = typeof nodeModule().stripTypeScriptTypes === 'function';
function evalModule(code, filename, opts = {}, format = toFormat(filename, true)) {
  let inputCode = code;
  let inputFilename = filename;
  let diagnostic;
  if (format === 'typescript' || format === 'module-typescript' || format === 'commonjs-typescript') {
    const ts = loadTypescript();
    if (ts) {
      let module;
      if (format === 'commonjs-typescript') {
        module = ts.ModuleKind.CommonJS;
      } else if (format === 'module-typescript') {
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
  } else if (format === 'commonjs') {
    inputCode = (0, _transform().toCommonJS)(filename, code);
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
  const isTypeScript = format === 'module-typescript' || format === 'commonjs-typescript' || format === 'typescript';
  try {
    if (format !== 'module' && !isTypeScript) {
      return require(filename);
    }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw error;
    } else if (format == null) {
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