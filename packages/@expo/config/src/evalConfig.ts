import { readFileSync } from 'fs';
import requireString from 'require-from-string';
import { transform } from 'sucrase';

import { AppJSONConfig, ConfigContext, ExpoConfig } from './Config.types';
import { ConfigError } from './Errors';
import { serializeSkippingMods } from './Serialize';

type RawDynamicConfig = AppJSONConfig | Partial<ExpoConfig> | null;

export type DynamicConfigResults = { config: RawDynamicConfig; exportedObjectType: string };

/**
 * Transpile and evaluate the dynamic config object.
 * This method is shared between the standard reading method in getConfig, and the headless script.
 *
 * @param options configFile path to the dynamic app.config.*, request to send to the dynamic config if it exports a function.
 * @returns the serialized and evaluated config along with the exported object type (object or function).
 */
export function evalConfig(
  configFile: string,
  request: ConfigContext | null
): DynamicConfigResults {
  const contents = readFileSync(configFile, 'utf8');
  let result: any;
  try {
    const { code } = transform(contents, {
      filePath: configFile,
      transforms: ['typescript', 'imports'],
    });

    result = requireString(code, configFile);
  } catch (error: any) {
    const location = extractLocationFromSyntaxError(error);

    // Apply a code frame preview to the error if possible, sucrase doesn't do this by default.
    if (location) {
      const { codeFrameColumns } = require('@babel/code-frame');
      const codeFrame = codeFrameColumns(contents, { start: error.loc }, { highlightCode: true });
      error.codeFrame = codeFrame;
      error.message += `\n${codeFrame}`;
    } else {
      const importantStack = extractImportantStackFromNodeError(error);

      if (importantStack) {
        error.message += `\n${importantStack}`;
      }
    }
    throw error;
  }
  return resolveConfigExport(result, configFile, request);
}

function extractLocationFromSyntaxError(
  error: Error | any
): { line: number; column?: number } | null {
  // sucrase provides the `loc` object
  if (error.loc) {
    return error.loc;
  }

  // `SyntaxError`s provide the `lineNumber` and `columnNumber` properties
  if ('lineNumber' in error && 'columnNumber' in error) {
    return { line: error.lineNumber, column: error.columnNumber };
  }

  return null;
}

// These kinda errors often come from syntax errors in files that were imported by the main file.
// An example is a module that includes an import statement.
function extractImportantStackFromNodeError(error: any): string | null {
  if (isSyntaxError(error)) {
    const traces = error.stack?.split('\n').filter(line => !line.startsWith('    at '));
    if (!traces) return null;

    // Remove redundant line
    if (traces[traces.length - 1].startsWith('SyntaxError:')) {
      traces.pop();
    }
    return traces.join('\n');
  }
  return null;
}

function isSyntaxError(error: any): error is SyntaxError {
  return error instanceof SyntaxError || error.constructor.name === 'SyntaxError';
}

/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param result
 * @param configFile
 * @param request
 */
export function resolveConfigExport(
  result: any,
  configFile: string,
  request: ConfigContext | null
) {
  if (result.default != null) {
    result = result.default;
  }
  const exportedObjectType = typeof result;
  if (typeof result === 'function') {
    result = result(request);
  }

  if (result instanceof Promise) {
    throw new ConfigError(`Config file ${configFile} cannot return a Promise.`, 'INVALID_CONFIG');
  }

  // If the expo object exists, ignore all other values.
  if (result?.expo) {
    result = serializeSkippingMods(result.expo);
  } else {
    result = serializeSkippingMods(result);
  }

  return { config: result, exportedObjectType };
}
