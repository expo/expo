import fs from 'node:fs';
import * as nodeModule from 'node:module';
import path from 'node:path';
import url from 'node:url';

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

let ts: typeof import('typescript') | null | undefined;

function loadTypescript() {
  if (ts === undefined) {
    try {
      ts = require('typescript');
    } catch (error: any) {
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
  if (filename.endsWith('.ts') || filename.endsWith('.cts') || filename.endsWith('.mts')) {
    const ext = path.extname(filename);
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
          inlineSourceMap: true,
        },
      });
      inputCode = output ? output.outputText : inputCode;
    }

    if (hasStripTypeScriptTypes && inputCode === code) {
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

  const mod = compileModule(inputCode, inputFilename, opts);
  if (inputFilename !== filename) {
    require.cache[filename] = mod;
  }
  return mod;
}

async function requireOrImport(filename: string) {
  try {
    return require(filename);
  } catch {
    return await import(
      path.isAbsolute(filename)
        ? url.pathToFileURL(filename).toString()
        : filename
    );
  }
}

async function loadModule(filename: string) {
  try {
    return await requireOrImport(filename);
  } catch (error: any) {
    if (error.code === 'ERR_UNKNOWN_FILE_EXTENSION' && isTypescriptFilename(filename)) {
      const code = await fs.promises.readFile(filename, 'utf8');
      return evalModule(code, filename);
    } else {
      throw error;
    }
  }
}

export { evalModule, loadModule };
