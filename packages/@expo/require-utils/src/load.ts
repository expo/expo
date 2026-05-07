import fs from 'node:fs';
import * as nodeModule from 'node:module';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import type * as ts from 'typescript';

import { annotateError, formatDiagnostic } from './codeframe';
import { installSourceMapStackTrace } from './stacktrace';
import { toCommonJS } from './transform';

declare module 'node:module' {
  export function _nodeModulePaths(base: string): readonly string[];
}

declare global {
  namespace NodeJS {
    export interface Module {
      _compile(
        code: string,
        filename: string,
        format?: 'module' | 'commonjs' | 'commonjs-typescript' | 'module-typescript' | 'typescript'
      ): unknown;
    }
    export interface Process {
      isBun?: boolean;
    }
  }
}

let _ts: typeof import('typescript') | null | undefined;
function loadTypescript() {
  if (_ts === undefined) {
    try {
      _ts = require('typescript');
    } catch (error: any) {
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

const tsExtensionMapping: Record<string, string | undefined> = {
  '.ts': '.js',
  '.cts': '.cjs',
  '.mts': '.mjs',
};

function maybeReadFileSync(filename: string) {
  try {
    return fs.readFileSync(filename, 'utf8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

type Format = 'commonjs' | 'module' | 'module-typescript' | 'commonjs-typescript' | 'typescript';

function toFormat(filename: string, isLegacy: true): Format;
function toFormat(filename: string, isLegacy: false): Format | null;
function toFormat(filename: string, isLegacy: boolean): Format | null {
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

export interface ModuleOptions {
  paths?: string[];
  sourceMap?: string;
  cache?: boolean;
}

function toRealDirname(filePath: string): string {
  let normalized = path.resolve(filePath);
  // Try resolving the filename itself first
  try {
    normalized = fs.realpathSync(normalized);
    return path.dirname(normalized);
  } catch (error: any) {
    normalized = path.dirname(normalized);
    // If we're getting another error than an ENOENT, return the dirname unchanged
    if (error?.code !== 'ENOENT') {
      return normalized;
    }
  }
  // Alternatively, if it's a fake path, resolve the directory directly instead
  try {
    return fs.realpathSync(normalized);
  } catch {
    return normalized;
  }
}

const hasModuleSourceMapsSupport = typeof nodeModule.setSourceMapsSupport === 'function';

interface SourceMapsState {
  enabled: boolean;
  nodeModules?: boolean;
  generatedCode?: boolean;
}

function getSourceMapsState(): SourceMapsState {
  return typeof nodeModule.getSourceMapsSupport === 'function'
    ? nodeModule.getSourceMapsSupport()
    : { enabled: !!process.sourceMapsEnabled };
}

function setSourceMapsState(state: SourceMapsState): void {
  if (hasModuleSourceMapsSupport) {
    nodeModule.setSourceMapsSupport(state.enabled, {
      nodeModules: state.nodeModules ?? false,
      generatedCode: state.generatedCode ?? false,
    });
  } else {
    process.setSourceMapsEnabled(state.enabled);
  }
}

function makeSourceMapTempPath(filename: string) {
  let basename = path.basename(filename);
  const queryIdx = basename.search(/[?#]/);
  if (queryIdx >= 0) {
    basename = basename.slice(0, queryIdx);
  }
  return path.join(os.tmpdir(), `require-utils-${process.pid}-${basename}.map`);
}

function stripSourceMappingURL(code: string): string {
  return code.replace(/^[ \t]*\/\/[#@][ \t]+sourceMappingURL=.*$/gm, '');
}

function compileModule(code: string, filename: string, opts: ModuleOptions) {
  const format = toFormat(filename, false);
  const shouldCache = opts.cache ?? true;
  const prependPaths = opts.paths ?? [];
  // See: https://github.com/nodejs/node/blob/ff080948666f28fbd767548d26bea034d30bc277/lib/internal/modules/cjs/loader.js#L767
  // If we get a symlinked path instead of the realpath, we assume the realpath is needed for Node module resolution
  const basePath = toRealDirname(filename);
  const nodeModulePaths = nodeModule._nodeModulePaths(basePath);
  const paths = [...prependPaths, ...nodeModulePaths];

  let inputCode = code;

  // We may get a Metro SSR relative path here, which isn't a valid absolute path, and we need to normalize
  // the filename before proceeding
  let compileFilename = filename;
  if (opts.sourceMap) {
    const queryIdx = filename.search(/[?#]/);
    const basePart = queryIdx >= 0 ? filename.slice(0, queryIdx) : filename;
    const queryPart = queryIdx >= 0 ? filename.slice(queryIdx) : '';
    if (!path.isAbsolute(basePart)) {
      compileFilename = path.resolve(basePart) + queryPart;
    }
  }

  let mapPath: string | undefined;
  let priorSourceMapsState: SourceMapsState | undefined;
  if (opts.sourceMap && !process.isBun) {
    try {
      mapPath = makeSourceMapTempPath(compileFilename);
      fs.writeFileSync(mapPath, opts.sourceMap);
    } catch (error: any) {
      mapPath = undefined;
      // If we fail to write the source map, we can still continue without it, but log a warning since it's likely a misconfiguration
      console.warn(
        `Warning: Failed to write source map for ${filename} to ${mapPath}. Source maps will be unavailable for this module.\n${error?.message || error}`
      );
    }

    if (mapPath) {
      inputCode = stripSourceMappingURL(code);
      // NOTE This needs to be a plain absolute path because Node rejects file: URLs
      inputCode += `\n//# sourceMappingURL=${mapPath}`;

      priorSourceMapsState = getSourceMapsState();
      installSourceMapStackTrace();
      setSourceMapsState({ enabled: true, nodeModules: true });
    }
  }

  const mod = Object.assign(new nodeModule.Module(compileFilename, parent), {
    filename: compileFilename,
    paths,
  });

  const childIdx = parent?.children?.indexOf(mod) ?? -1;
  if (childIdx >= 0) {
    parent.children!.splice(childIdx, 1);
  }

  try {
    mod._compile(inputCode, compileFilename, format != null ? format : undefined);
    mod.loaded = true;
    if (shouldCache) {
      require.cache[compileFilename] = mod;
      if (compileFilename !== filename) {
        require.cache[filename] = mod;
      }
    }
    return mod;
  } catch (error: any) {
    if (shouldCache) {
      delete require.cache[compileFilename];
      if (compileFilename !== filename) {
        delete require.cache[filename];
      }
    }
    throw error;
  } finally {
    if (mapPath) {
      // Restore, so subsequent requires of node_modules won't have their source-maps read
      setSourceMapsState(priorSourceMapsState ?? { enabled: false });
      // Node parses source maps eagerly during _compile, so the file can be removed now.
      try {
        fs.unlinkSync(mapPath);
      } catch {
        /* noop */
      }
    }
  }
}

const hasStripTypeScriptTypes = typeof nodeModule.stripTypeScriptTypes === 'function';

function evalModule(
  code: string,
  filename: string,
  opts: ModuleOptions = {},
  format: Format = toFormat(filename, true)
) {
  const shouldCache = opts.cache ?? true;

  let inputCode = code;
  let inputFilename = filename;
  let diagnostic: ts.Diagnostic | undefined;
  if (
    format === 'typescript' ||
    format === 'module-typescript' ||
    format === 'commonjs-typescript'
  ) {
    const ts = loadTypescript();

    if (ts) {
      let module: ts.ModuleKind;
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
          esModuleInterop: true,
        },
      });
      inputCode = output?.outputText || inputCode;
      if (output?.diagnostics?.length) {
        diagnostic = output.diagnostics[0];
      }
    }

    if (hasStripTypeScriptTypes && inputCode === code) {
      // This may throw its own error, but this contains a code-frame already
      inputCode = nodeModule.stripTypeScriptTypes(code, {
        mode: 'transform',
        sourceMap: true,
      });
    }

    if (inputCode !== code) {
      const ext = path.extname(filename);
      const inputExt = tsExtensionMapping[ext] ?? ext;
      if (inputExt !== ext) {
        inputFilename = path.join(path.dirname(filename), path.basename(filename, ext) + inputExt);
      }
    }
  } else if (format === 'commonjs') {
    inputCode = toCommonJS(filename, code);
  }

  try {
    const mod = compileModule(inputCode, inputFilename, opts);
    if (shouldCache && inputFilename !== filename) {
      require.cache[filename] = mod;
    }
    return mod.exports;
  } catch (error: any) {
    // If we have a diagnostic from TypeScript, we issue its error with a codeframe first,
    // since it's likely more useful than the eval error
    const diagnosticError = formatDiagnostic(diagnostic);
    if (diagnosticError) {
      throw diagnosticError;
    }
    throw annotateError(code, filename, error) ?? error;
  }
}

async function requireOrImport(filename: string) {
  try {
    return require(filename);
  } catch {
    return await import(
      path.isAbsolute(filename) ? url.pathToFileURL(filename).toString() : filename
    );
  }
}

async function loadModule(filename: string) {
  try {
    return await requireOrImport(filename);
  } catch (error: any) {
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
function loadModuleSync(filename: string) {
  const format = toFormat(filename, true);
  const isTypeScript =
    format === 'module-typescript' || format === 'commonjs-typescript' || format === 'typescript';
  try {
    if (format !== 'module' && !isTypeScript) {
      return require(filename);
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw error;
    } else if (format == null) {
      const code = maybeReadFileSync(filename);
      throw annotateError(code, filename, error) || error;
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

  const code = fs.readFileSync(filename, 'utf8');
  return evalModule(code, filename, {}, format);
}

export { evalModule, loadModule, loadModuleSync };
