import path from 'path';
import * as ts from 'typescript';

const entryFile = path.resolve(__dirname, '../index.tsx');
const expectFile = path.resolve(__dirname, '../expect.ts');
const repoRoot = path.resolve(__dirname, '../../../../..');
const consumerFile = path.join(__dirname, 'matcher-types-consumer.tsx');
const stubFile = path.join(__dirname, 'matcher-types-stub.ts');

const virtualFiles = new Map<string, string>([
  [
    consumerFile,
    `
import ${JSON.stringify(entryFile)};

expect(null).toHavePathname('/');
expect(null).toHavePathnameWithParams('/?q=1');
expect(null).toHaveSegments(['index']);
expect(null).toHaveSearchParams({ q: '1' });
expect(null).toHaveRouterState(undefined);
expect(null).not.toHavePathname('/missing');
`,
  ],
  [stubFile, 'export {};\n'],
]);

function normalize(fileName: string): string {
  return path.normalize(fileName);
}

// Only the testing-library entry and `./expect` are real modules in this program.
// Other imports are stubs, so the matchers exist only when that entry pulls them in.
function resolveOne(moduleName: string, containingFile: string): ts.ResolvedModuleFull {
  const fromEntry = normalize(containingFile) === entryFile;
  if (fromEntry && (moduleName === './expect' || moduleName === './expect.ts')) {
    return {
      resolvedFileName: expectFile,
      extension: ts.Extension.Ts,
      isExternalLibraryImport: false,
    };
  }
  if (
    moduleName === entryFile ||
    moduleName.endsWith(`${path.sep}testing-library${path.sep}index.tsx`)
  ) {
    return {
      resolvedFileName: entryFile,
      extension: ts.Extension.Tsx,
      isExternalLibraryImport: false,
    };
  }
  return {
    resolvedFileName: stubFile,
    extension: ts.Extension.Ts,
    isExternalLibraryImport: false,
  };
}

function createHost(options: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);

  host.fileExists = (fileName) =>
    virtualFiles.has(normalize(fileName)) || originalFileExists(fileName);
  host.readFile = (fileName) => virtualFiles.get(normalize(fileName)) ?? originalReadFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const virtual = virtualFiles.get(normalize(fileName));
    if (virtual != null) {
      return ts.createSourceFile(fileName, virtual, languageVersion, true, ts.ScriptKind.TSX);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  host.resolveModuleNames = (moduleNames, containingFile) =>
    moduleNames.map((moduleName) => resolveOne(moduleName, containingFile));
  host.resolveModuleNameLiterals = (moduleLiterals, containingFile) =>
    moduleLiterals.map((literal) => ({
      resolvedModule: resolveOne(literal.text, containingFile),
    }));
  return host;
}

it('adds the router matchers to Jest when expo-router/testing-library is imported', () => {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    types: ['jest'],
    typeRoots: [path.join(repoRoot, 'node_modules/@types')],
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };
  const host = createHost(options);
  const program = ts.createProgram([consumerFile], options, host);
  const source = program.getSourceFile(consumerFile);
  if (!source) {
    throw new Error(`TypeScript did not load ${consumerFile}`);
  }
  const diagnostics = ts.getPreEmitDiagnostics(program, source);
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
  expect(formatted).toBe('');
});

it('emits the matcher augmentation from the expect module', () => {
  const options: ts.CompilerOptions = {
    strict: true,
    declaration: true,
    emitDeclarationOnly: true,
    outDir: path.join(__dirname, '.matcher-types-emit'),
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    types: ['jest'],
    typeRoots: [path.join(repoRoot, 'node_modules/@types')],
    skipLibCheck: true,
    esModuleInterop: true,
  };
  const emitted = new Map<string, string>();
  const host = ts.createCompilerHost(options);
  host.writeFile = (fileName, data) => {
    emitted.set(path.normalize(fileName), data);
  };
  const program = ts.createProgram([expectFile], options, host);
  const result = program.emit();
  const formatted = ts.formatDiagnosticsWithColorAndContext(
    result.diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error),
    host
  );
  expect(formatted).toBe('');
  const declaration = [...emitted.values()].join('\n');
  expect(declaration).toContain('declare global');
  expect(declaration).toContain('namespace jest');
  expect(declaration).toContain('toHavePathname(pathname: string)');
  expect(declaration).toContain('toHavePathnameWithParams(pathname: string)');
  expect(declaration).toContain('toHaveSegments(segments: string[])');
  expect(declaration).toContain('toHaveSearchParams(params: Record<string, string | string[]>)');
  expect(declaration).toContain('toHaveRouterState(state: Record<string, unknown> | undefined)');
});
