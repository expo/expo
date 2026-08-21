import type { DefinedNativePlugin, NativeNodePath } from 'noxcturnal';

import { expoPluginInput } from '../noxcturnal-transformer';
import type { Noxcturnal } from '../noxcturnal-transformer';

interface DeepImportWarningState {
  warnings: { source: string; line: number; column: number }[];
}

export function createDeepReactNativeImportWarningsPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<DeepImportWarningState> {
  const record = (
    source: unknown,
    path: Pick<NativeNodePath, 'getLocation'>,
    state: DeepImportWarningState
  ) => {
    if (
      typeof source !== 'string' ||
      !source.startsWith('react-native/') ||
      source === 'react-native/Libraries/Core/InitializeCore'
    )
      return;
    const location = path.getLocation().start;
    state.warnings.push({
      source,
      line: location.line,
      column: location.column,
    });
  };
  return nox.defineNativePlugin<DeepImportWarningState>({
    name: 'expo-warn-deep-react-native-imports',
    createState: () => ({ warnings: [] }),
    visitors: [
      nox.defineVisitor('ImportDeclaration', { fields: ['source'] }, (path, state) =>
        record(path.node.source, path, state)
      ),
      nox.defineVisitor('ExportNamedDeclaration', { fields: ['source'] }, (path, state) =>
        record(path.node.source, path, state)
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          fields: ['calleeName', 'staticArgument', 'argumentCount'],
        },
        (path, state) => {
          if (path.node.calleeName === 'require' && path.node.argumentCount === 1) {
            record(path.node.staticArgument, path, state);
          }
        }
      ),
    ],
    post(context, state) {
      const { filename } = expoPluginInput(context);
      for (const warning of state.warnings) {
        const message =
          `Deep imports from the 'react-native' package are deprecated ('${warning.source}').` +
          ` Source: ${filename} ${warning.line}:${warning.column}`;
        context.editor.prependLeft(
          context.source.length,
          `\nconsole.warn(${JSON.stringify(message)});`
        );
      }
    },
  });
}
