import fs from 'node:fs';
import * as nodeModule from 'node:module';
import path from 'node:path';
import url from 'node:url';
import type * as ts from 'typescript';

import { annotateError, formatDiagnostic } from './codeframe';

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

function toFormat(filename: string) {
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

function isTypescriptFilename(filename: string) {
  switch (toFormat(filename)) {
    case 'module-typescript':
    case 'commonjs-typescript':
    case 'typescript':
      return true;
    default:
      return false;
  }
}

export interface ModuleOptions {
  paths?: string[];
}

function compileModule<T = any>(code: string, filename: string, opts: ModuleOptions): T {
  const format = toFormat(filename);
  const prependPaths = opts.paths ?? [];
  const nodeModulePaths = nodeModule._nodeModulePaths(path.dirname(filename));
  const paths = [...prependPaths, ...nodeModulePaths];
  try {
    const mod = Object.assign(new nodeModule.Module(filename, parent), { filename, paths });
    mod._compile(code, filename, format);
    require.cache[filename] = mod;
    parent?.children?.splice(parent.children.indexOf(mod), 1);
    return mod.exports;
  } catch (error: any) {
    delete require.cache[filename];
    throw error;
  }
}

const hasStripTypeScriptTypes = typeof nodeModule.stripTypeScriptTypes === 'function';

function evalModule(code: string, filename: string, opts: ModuleOptions = {}) {
  let inputCode = code;
  let inputFilename = filename;
  let diagnostic: ts.Diagnostic | undefined;
  if (filename.endsWith('.ts') || filename.endsWith('.cts') || filename.endsWith('.mts')) {
    const ext = path.extname(filename);
    const ts = loadTypescript();

    if (ts) {
      let module: ts.ModuleKind;
      if (ext === '.cts') {
        module = ts.ModuleKind.CommonJS;
      } else if (ext === '.mts') {
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
      const inputExt = tsExtensionMapping[ext] ?? ext;
      if (inputExt !== ext) {
        inputFilename = path.join(path.dirname(filename), path.basename(filename, ext) + inputExt);
      }
    }
  }

  try {
    const mod = compileModule(inputCode, inputFilename, opts);
    if (inputFilename !== filename) {
      require.cache[filename] = mod;
    }
    return mod;
  } catch (error: any) {
    // If we have a diagnostic from TypeScript, we issue its error with a codeframe first,
    // since it's likely more useful than the eval error
    throw formatDiagnostic(diagnostic) ?? annotateError(code, filename, error) ?? error;
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
  try {
    if (!isTypescriptFilename(filename)) {
      return require(filename);
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw error;
    }
    // We fallback to always evaluating the entrypoint module
    // This is out of safety, since we're not trusting the requiring ESM feature
    // and evaluating the module manually bypasses the error when it's flagged off
  }
  const code = fs.readFileSync(filename, 'utf8');
  return evalModule(code, filename);
}

export { evalModule, loadModule, loadModuleSync };
