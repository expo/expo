"use strict";

exports.__esModule = true;
exports.transpile = transpile;
function compilerOptions(enums, newLine, format) {
  return {
    module: format === 'commonjs-typescript' ? enums.ModuleKind.CommonJS : format === 'module-typescript' ? enums.ModuleKind.ESNext : enums.ModuleKind.Preserve,
    moduleResolution: enums.ModuleResolutionKind.Bundler,
    // Erase unused imports, and preserve the user's choice of CJS or ESM in preserve mode.
    verbatimModuleSyntax: false,
    target: enums.ScriptTarget.ESNext,
    newLine,
    inlineSourceMap: true,
    esModuleInterop: true
  };
}
function requireOptional(id) {
  try {
    return require(id);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return null;
    }
    throw error;
  }
}
function flattenNativeDiagnostic(diagnostic) {
  return [diagnostic.text, ...(diagnostic.messageChain?.map(flattenNativeDiagnostic) ?? [])].join('\n');
}
function loadTranspiler() {
  const legacy = requireOptional('typescript');
  if (!legacy) {
    return null;
  }
  if (typeof legacy.transpileModule === 'function') {
    return (code, filename, format) => {
      const output = legacy.transpileModule(code, {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: compilerOptions(legacy, legacy.NewLineKind.LineFeed, format)
      });
      const diagnostic = output.diagnostics?.[0];
      const position = diagnostic?.file && diagnostic.start != null ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
      return {
        outputText: output.outputText,
        diagnostic: diagnostic && {
          message: legacy.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          loc: position && {
            line: position.line + 1,
            column: position.character + 1
          }
        }
      };
    };
  }

  // NOTE(@kitten): Typescript 7.1+ API shape
  const native = requireOptional('typescript/unstable/sync');
  if (typeof native?.API !== 'function' || !('transpileModule' in native.API.prototype)) {
    return null;
  }
  const enums = require('typescript/unstable/proto');
  const api = new native.API();
  return (code, filename, format) => {
    const output = api.transpileModule(code, {
      fileName: filename,
      reportDiagnostics: true,
      compilerOptions: compilerOptions(enums, enums.NewLineKind.LF, format)
    });
    const diagnostic = output.diagnostics?.[0];
    const position = diagnostic?.startPosition;
    return {
      outputText: output.outputText,
      diagnostic: diagnostic && {
        message: flattenNativeDiagnostic(diagnostic),
        loc: position && {
          line: position.line + 1,
          column: position.character + 1
        }
      }
    };
  };
}
let transpiler;
function transpile(code, filename, format) {
  if (transpiler === undefined) {
    transpiler = loadTranspiler();
  }
  return transpiler?.(code, filename, format);
}
//# sourceMappingURL=typescript.js.map