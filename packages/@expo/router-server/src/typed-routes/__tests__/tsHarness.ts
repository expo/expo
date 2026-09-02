import { createFSBackedSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import { resolve } from 'node:path';
import ts from 'typescript';

// Real package root so the virtual program resolves `expo-router` and `expect-type` from
// `node_modules`; virtual files are layered on top of it via an FS-backed system.
const projectRoot = resolve(__dirname, '../../..');
const virtualRoot = resolve(projectRoot, '__tsHarness__');

const compilerOptions: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  esModuleInterop: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  resolveJsonModule: true,
};

/**
 * Type-checks a set of virtual files against the real `expo-router` types and returns the
 * resulting diagnostics. Generated route declarations are passed in as virtual modules so each
 * call gets its own isolated program — unlike a shared `tsc` run, conflicting `declare module`
 * augmentations across fixtures never collide.
 */
export function getTypeErrors(files: Record<string, string>): ts.Diagnostic[] {
  const fsMap = new Map<string, string>();
  for (const [name, content] of Object.entries(files)) {
    fsMap.set(resolve(virtualRoot, name), content);
  }

  const system = createFSBackedSystem(fsMap, projectRoot, ts);
  const env = createVirtualTypeScriptEnvironment(system, [...fsMap.keys()], ts, compilerOptions);

  return [...fsMap.keys()].flatMap((file) => [
    ...env.languageService.getSyntacticDiagnostics(file),
    ...env.languageService.getSemanticDiagnostics(file),
  ]);
}

/**
 * Identity tag for the virtual assertion snippets. It returns the source verbatim; its only
 * purpose is to mark the template literal as TypeScript so editors syntax-highlight it.
 */
function tsSnippet(strings: TemplateStringsArray, ...values: unknown[]): string {
  return String.raw({ raw: strings }, ...values);
}

export { tsSnippet as ts };

export function formatDiagnostics(diagnostics: ts.Diagnostic[]): string {
  return diagnostics
    .map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      if (d.file && d.start !== undefined) {
        const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
        const name = d.file.fileName.split('/').pop();
        return `${name}(${line + 1},${character + 1}): ${message}`;
      }
      return message;
    })
    .join('\n');
}
