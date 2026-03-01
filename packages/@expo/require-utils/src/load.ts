import fs from 'node:fs';
import * as nodeModule from 'node:module';
import path from 'node:path';
import url from 'node:url';
import type * as ts from 'typescript';

import { annotateError, formatDiagnostic } from './codeframe';
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
}

function compileModule(code: string, filename: string, opts: ModuleOptions) {
  const format = toFormat(filename, false);
  const prependPaths = opts.paths ?? [];
  const nodeModulePaths = nodeModule._nodeModulePaths(path.dirname(filename));
  const paths = [...prependPaths, ...nodeModulePaths];
  try {
    const mod = Object.assign(new nodeModule.Module(filename, parent), { filename, paths });
    mod._compile(code, filename, format != null ? format : undefined);
    mod.loaded = true;
    require.cache[filename] = mod;
    parent?.children?.splice(parent.children.indexOf(mod), 1);
    return mod;
  } catch (error: any) {
    delete require.cache[filename];
    throw error;
  }
}

const hasStripTypeScriptTypes = typeof nodeModule.stripTypeScriptTypes === 'function';

function evalModule(
  code: string,
  filename: string,
  opts: ModuleOptions = {},
  format: Format = toFormat(filename, true)
) {
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
    if (inputFilename !== filename) {
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
