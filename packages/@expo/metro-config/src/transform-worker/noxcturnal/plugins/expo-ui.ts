import type { Code, DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

interface ExpoUiState {
  iconLocals: Set<string>;
  namespaceLocals: Set<string>;
}

export function createExpoUiPlugin(
  nox: Noxcturnal,
  platform: string | null | undefined
): DefinedNativePlugin<ExpoUiState> {
  return nox.defineNativePlugin({
    name: 'expo-ui-icon-select',
    createState: () => ({ iconLocals: new Set(), namespaceLocals: new Set() }),
    visitors: [
      nox.defineVisitor(
        'ImportDeclaration',
        {
          fields: ['source', 'importKind'],
          children: {
            specifiers: {
              route: 'ImportSpecifier|ImportNamespaceSpecifier|ImportDefaultSpecifier',
              fields: ['local', 'imported', 'importKind'],
            },
          },
        },
        (importPath, state) => {
          if (
            importPath.node.source !== '@expo/ui' ||
            (importPath.node.importKind && importPath.node.importKind !== 'value')
          ) {
            return;
          }
          for (const specifier of importPath.getChildList('specifiers')) {
            if (
              specifier.node.type === 'ImportSpecifier' &&
              specifier.node.imported === 'Icon' &&
              (!specifier.node.importKind || specifier.node.importKind === 'value')
            ) {
              state.iconLocals.add(String(specifier.node.local));
            } else if (specifier.node.type === 'ImportNamespaceSpecifier') {
              state.namespaceLocals.add(String(specifier.node.local));
            }
          }
        }
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          fields: ['argumentCount'],
          children: {
            callee: { route: 'Expression', fields: ['memberPath'] },
            arguments: {
              route: 'ObjectExpression',
              children: {
                properties: {
                  route: 'ObjectProperty|SpreadElement',
                  fields: ['key', 'kind', 'computed', 'method', 'shorthand'],
                  children: {
                    value: { route: 'Expression', fields: ['staticArgument'] },
                  },
                },
              },
            },
          },
        },
        (call, state) => {
          if (call.node.argumentCount !== 1) return;
          const callee = call.getChild('callee');
          if (!callee) return;
          const direct = [...state.iconLocals].some((name) =>
            callee.matchesPattern(`${name}.select`)
          );
          const namespace =
            !direct &&
            [...state.namespaceLocals].some((name) => callee.matchesPattern(`${name}.Icon.select`));
          if (!direct && !namespace) return;

          const argument = call.getChildList('arguments')[0];
          if (!argument?.is('ObjectExpression')) return;
          const properties = argument.getChildList('properties');
          const values = new Map<string, Code>();
          for (const property of properties) {
            if (property.node.type !== 'ObjectProperty') return;
            const key = property.node.key;
            if (
              property.node.kind !== 'init' ||
              property.node.computed ||
              property.node.method ||
              property.node.shorthand ||
              (key !== 'ios' && key !== 'android')
            ) {
              return;
            }
            const value = property.getChild('value');
            if (!value) return;
            values.set(key, value.getSource());
          }
          const iosSource = values.get('ios');
          let androidSource = values.get('android');
          if (!iosSource || !androidSource) return;

          const androidValue = properties
            .find(
              (property) =>
                property.node.type === 'ObjectProperty' && property.node.key === 'android'
            )
            ?.getChild('value');
          if (
            platform !== 'ios' &&
            platform !== 'web' &&
            androidValue?.node.type === 'ImportExpression'
          ) {
            const source = androidValue.node.staticArgument;
            if (typeof source !== 'string') return;
            androidSource = call.context.code
              .template`require(${call.context.code.stringLiteral(source)})`;
          }
          if (platform === 'ios') {
            call.replaceWith(iosSource);
          } else if (platform === 'android') {
            call.replaceWith(androidSource);
          } else if (platform === 'web') {
            call.replaceWith('undefined');
          } else {
            call.replaceWith(
              call.context.code
                .template`process.env.EXPO_OS === "ios" ? ${iosSource} : process.env.EXPO_OS === "android" ? ${androidSource} : undefined`
            );
          }
        }
      ),
    ],
  });
}
