import path from 'path';
import resolveFrom from 'resolve-from';

export function evaluateTsConfig(ts: typeof import('typescript'), tsConfigPath: string) {
  const formatDiagnosticsHost: import('typescript').FormatDiagnosticsHost = {
    getNewLine: () => require('os').EOL,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (fileName: string) => fileName,
  };

  try {
    const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

    if (error) {
      throw new Error(ts.formatDiagnostic(error, formatDiagnosticsHost));
    }

    const jsonFileContents = ts.parseJsonConfigFileContent(
      config,
      {
        ...ts.sys,
        readDirectory: (_, ext) => [ext ? `file${ext[0]}` : `file.ts`],
      },
      path.dirname(tsConfigPath)
    );

    if (jsonFileContents.errors) {
      // filter out "no inputs were found in config file" error
      jsonFileContents.errors = jsonFileContents.errors.filter(({ code }) => code !== 18003);
    }

    if (jsonFileContents.errors?.length) {
      throw new Error(ts.formatDiagnostic(jsonFileContents.errors[0], formatDiagnosticsHost));
    }

    return { compilerOptions: jsonFileContents.options, raw: config.raw };
  } catch (error: any) {
    if (error?.name === 'SyntaxError') {
      throw new Error('tsconfig.json is invalid:\n' + (error.message ?? ''));
    }
    throw error;
  }
}

export function importTypeScriptFromProjectOptionally(
  projectRoot: string
): typeof import('typescript') | null {
  const resolvedPath = resolveFrom.silent(projectRoot, 'typescript');
  if (!resolvedPath) {
    return null;
  }
  return require(resolvedPath);
}
