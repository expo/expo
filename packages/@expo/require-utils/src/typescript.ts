import type * as ts from 'typescript';

import type { Diagnostic } from './codeframe';

type ModuleFormat = 'commonjs-typescript' | 'module-typescript' | 'typescript';
type CompilerEnums = Pick<typeof ts, 'ModuleKind' | 'ModuleResolutionKind' | 'ScriptTarget'>;

interface NativeDiagnostic {
  text: string;
  startPosition?: { line: number; character: number };
  messageChain?: NativeDiagnostic[];
}

interface NativeAPI {
  transpileModule(
    code: string,
    options: ts.TranspileOptions
  ): { outputText: string; diagnostics?: readonly NativeDiagnostic[] };
}

function compilerOptions(
  enums: CompilerEnums,
  newLine: number,
  format: ModuleFormat
): ts.CompilerOptions {
  return {
    module:
      format === 'commonjs-typescript'
        ? enums.ModuleKind.CommonJS
        : format === 'module-typescript'
          ? enums.ModuleKind.ESNext
          : enums.ModuleKind.Preserve,
    moduleResolution: enums.ModuleResolutionKind.Bundler,
    // Erase unused imports, and preserve the user's choice of CJS or ESM in preserve mode.
    verbatimModuleSyntax: false,
    target: enums.ScriptTarget.ESNext,
    newLine,
    inlineSourceMap: true,
    esModuleInterop: true,
  };
}

function requireOptional<T>(id: string): T | null {
  try {
    return require(id);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return null;
    }
    throw error;
  }
}

function flattenNativeDiagnostic(diagnostic: NativeDiagnostic): string {
  return [diagnostic.text, ...(diagnostic.messageChain?.map(flattenNativeDiagnostic) ?? [])].join(
    '\n'
  );
}

type Transpiler = (
  code: string,
  filename: string,
  format: ModuleFormat
) => { outputText: string; diagnostic?: Diagnostic };

function loadTranspiler(): Transpiler | null {
  const legacy = requireOptional<typeof ts>('typescript');
  if (!legacy) {
    return null;
  }

  if (typeof legacy.transpileModule === 'function') {
    return (code, filename, format) => {
      const output = legacy.transpileModule(code, {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: compilerOptions(legacy, legacy.NewLineKind.LineFeed, format),
      });
      const diagnostic = output.diagnostics?.[0];
      const position =
        diagnostic?.file && diagnostic.start != null
          ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
          : undefined;
      return {
        outputText: output.outputText,
        diagnostic: diagnostic && {
          message: legacy.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          loc: position && { line: position.line + 1, column: position.character + 1 },
        },
      };
    };
  }

  // NOTE(@kitten): Typescript 7.1+ API shape
  const native = requireOptional<{ API?: new () => NativeAPI }>('typescript/unstable/sync');
  if (typeof native?.API !== 'function' || !('transpileModule' in native.API.prototype)) {
    return null;
  }

  const enums: CompilerEnums & {
    NewLineKind: { LF: number };
  } = require('typescript/unstable/proto');
  const api = new native.API();

  return (code, filename, format) => {
    const output = api.transpileModule(code, {
      fileName: filename,
      reportDiagnostics: true,
      compilerOptions: compilerOptions(enums, enums.NewLineKind.LF, format),
    });
    const diagnostic = output.diagnostics?.[0];
    const position = diagnostic?.startPosition;
    return {
      outputText: output.outputText,
      diagnostic: diagnostic && {
        message: flattenNativeDiagnostic(diagnostic),
        loc: position && { line: position.line + 1, column: position.character + 1 },
      },
    };
  };
}

let transpiler: Transpiler | null | undefined;

export function transpile(code: string, filename: string, format: ModuleFormat) {
  if (transpiler === undefined) {
    transpiler = loadTranspiler();
  }
  return transpiler?.(code, filename, format);
}
