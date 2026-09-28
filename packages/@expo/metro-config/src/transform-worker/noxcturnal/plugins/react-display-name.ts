import path from 'node:path';
import type { DefinedNativePlugin } from 'noxcturnal';
import { isStatementType } from 'noxcturnal';

import { expoPluginInput } from '../noxcturnal-transformer';
import type { Noxcturnal } from '../noxcturnal-transformer';

export function createReactDisplayNamePlugin(nox: Noxcturnal): DefinedNativePlugin {
  interface DisplayNameAncestor {
    readonly node: {
      readonly type: string;
      readonly bindingName?: unknown;
      readonly key?: unknown;
      readonly targetName?: unknown;
    };
    readonly parentPath: DisplayNameAncestor | null;
  }
  const inferName = (call: { readonly parentPath: DisplayNameAncestor | null }): string | null => {
    let parent = call.parentPath;
    while (parent) {
      if (parent.node.type === 'VariableDeclarator') {
        return typeof parent.node.bindingName === 'string' ? parent.node.bindingName : null;
      }
      if (parent.node.type === 'ObjectProperty') {
        return typeof parent.node.key === 'string' ? parent.node.key : null;
      }
      if (parent.node.type === 'AssignmentExpression') {
        return typeof parent.node.targetName === 'string' ? parent.node.targetName : null;
      }
      if (isStatementType(parent.node.type)) return null;
      parent = parent.parentPath;
    }
    return null;
  };

  return nox.defineNativePlugin({
    name: 'expo-transform-react-display-name',
    visitors: [
      nox.defineVisitor(
        'CallExpression',
        {
          fields: ['argumentCount'],
          where: {
            calleePath: { oneOf: ['React.createClass', 'createReactClass'] },
          },
          ancestry: {
            mode: 'findParent',
            routes: {
              VariableDeclarator: { fields: ['bindingName'] },
              AssignmentExpression: { fields: ['targetName'] },
              ObjectProperty: { fields: ['key'] },
            },
          },
          children: {
            arguments: {
              route: 'ObjectExpression',
              children: {
                properties: { route: 'ObjectProperty', fields: ['key'] },
              },
            },
          },
        },
        (call) => {
          if (call.node.argumentCount !== 1) return;
          const object = call.getChildList('arguments')[0];
          if (!object?.is('ObjectExpression')) return;
          if (
            object
              .getChildList('properties')
              .some((property) => String(property.node.key) === 'displayName')
          ) {
            return;
          }

          let displayName = inferName(call);
          if (
            !displayName &&
            call.findParent((parent) => parent.node.type === 'ExportDefaultDeclaration') != null
          ) {
            const { filename } = expoPluginInput(call.context);
            displayName = path.basename(filename, path.extname(filename));
            if (displayName === 'index') displayName = path.basename(path.dirname(filename));
          }
          if (!displayName) return;
          call.context.editor.appendLeft(
            object.getSource().start + 1,
            `displayName: ${JSON.stringify(displayName)},`
          );
        }
      ),
    ],
  });
}
