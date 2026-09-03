import type { DefinedNativePlugin, NativeNodePath } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createEnvironmentRestrictedImportsPlugin(
  nox: Noxcturnal,
  forbidden: 'server-only' | 'client-only',
  skip: (context: { pluginData: unknown }) => boolean = () => false
): DefinedNativePlugin {
  const reject = (
    path: Pick<NativeNodePath, 'unsupported'> & {
      context: { pluginData: unknown };
    },
    source: unknown
  ) => {
    if (skip(path.context)) return;
    if (source === forbidden) {
      path.unsupported(`environment-restricted-import:${forbidden}`);
    }
  };
  return nox.defineNativePlugin({
    name: `expo-environment-restricted-imports-${forbidden}`,
    visitors: [
      nox.defineVisitor('ImportDeclaration', { fields: ['source'] }, (path) =>
        reject(path, path.node.source)
      ),
      nox.defineVisitor('ExportAllDeclaration', { fields: ['source'] }, (path) =>
        reject(path, path.node.source)
      ),
      nox.defineVisitor('ExportNamedDeclaration', { fields: ['source'] }, (path) =>
        reject(path, path.node.source)
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          fields: ['calleeName', 'staticArgument', 'argumentCount'],
          children: {
            callee: { route: 'Expression', fields: ['memberPath', 'name'] },
          },
        },
        (call) => {
          if (call.node.argumentCount < 1 || call.node.staticArgument !== forbidden) return;
          const calleePath = call.getChild('callee');
          const callee = String(
            call.node.calleeName ?? calleePath?.node.memberPath ?? calleePath?.node.name ?? ''
          );
          const allowed =
            (calleePath?.node.type === 'Identifier' && callee === 'require') ||
            (calleePath?.node.type !== 'Identifier' &&
              ['resolveWeak', 'importAll', 'importDefault'].some(
                (property) => callee === property || callee.endsWith(`.${property}`)
              ));
          if (allowed) reject(call, call.node.staticArgument);
        }
      ),
      nox.defineVisitor(
        'ImportExpression',
        {
          children: {
            source: { route: 'StringLiteral', fields: ['value'] },
          },
        },
        (importPath) => reject(importPath, importPath.getChild('source')?.node.value)
      ),
    ],
  });
}
