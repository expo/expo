import type { Code, CompositeFragment, DefinedNativePlugin, SourceFragment } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

const REACT_NATIVE_WEB_EXPORTS = new Set<string>([
  'AccessibilityInfo',
  'ActivityIndicator',
  'Alert',
  'Animated',
  'AppRegistry',
  'AppState',
  'Appearance',
  'BackHandler',
  'Button',
  'CheckBox',
  'Clipboard',
  'DeviceEventEmitter',
  'Dimensions',
  'Easing',
  'FlatList',
  'I18nManager',
  'Image',
  'ImageBackground',
  'InputAccessoryView',
  'InteractionManager',
  'Keyboard',
  'KeyboardAvoidingView',
  'LayoutAnimation',
  'Linking',
  'LogBox',
  'Modal',
  'NativeEventEmitter',
  'NativeModules',
  'PanResponder',
  'Picker',
  'PixelRatio',
  'Platform',
  'Pressable',
  'ProgressBar',
  'RefreshControl',
  'SafeAreaView',
  'ScrollView',
  'SectionList',
  'Share',
  'StatusBar',
  'StyleSheet',
  'Switch',
  'Text',
  'TextInput',
  'Touchable',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'UIManager',
  'Vibration',
  'View',
  'VirtualizedList',
  'YellowBox',
  'createElement',
  'findNodeHandle',
  'processColor',
  'render',
  'unmountComponentAtNode',
  'useColorScheme',
  'useLocaleContext',
  'useWindowDimensions',
]);

function reactNativeWebLocation(name: string): string | null {
  const internal = name === 'unstable_createElement' ? 'createElement' : name;
  return REACT_NATIVE_WEB_EXPORTS.has(internal)
    ? `react-native-web/dist/exports/${internal}`
    : null;
}

export function createReactNativeWebPlugin(nox: Noxcturnal): DefinedNativePlugin {
  const isRoot = (source: unknown) => source === 'react-native' || source === 'react-native-web';
  return nox.defineNativePlugin({
    name: 'expo-react-native-web',
    editEffect: 'bindings',
    visitors: [
      nox.defineVisitor(
        'ImportDeclaration',
        {
          fields: ['source'],
          children: {
            specifiers: {
              route: 'ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier',
              fields: ['local', 'imported'],
            },
          },
        },
        (importPath) => {
          if (!isRoot(importPath.node.source)) return;
          const specifiers = importPath.getChildList('specifiers');
          if (specifiers.length === 0) return;
          importPath.replaceWithMultiple(
            specifiers.map((specifier) => {
              if (specifier.node.type === 'ImportSpecifier') {
                const location = reactNativeWebLocation(String(specifier.node.imported));
                if (location) {
                  return `import ${String(specifier.node.local)} from ${JSON.stringify(location)};`;
                }
                return `import { ${specifier.sourceText()} } from "react-native-web/dist/index";`;
              }
              return `import ${specifier.sourceText()} from "react-native-web/dist/index";`;
            })
          );
        }
      ),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          fields: ['source'],
          children: {
            specifiers: {
              route: 'ExportSpecifier',
              fields: ['local', 'exported'],
            },
          },
        },
        (exportPath) => {
          if (!isRoot(exportPath.node.source)) return;
          const specifiers = exportPath.getChildList('specifiers');
          if (specifiers.length === 0) return;
          exportPath.replaceWithMultiple(
            specifiers.map((specifier) => {
              const local = String(specifier.node.local);
              const exported = String(specifier.node.exported);
              const location = reactNativeWebLocation(local);
              return location
                ? `export { default as ${exported} } from ${JSON.stringify(location)};`
                : `export { ${specifier.sourceText()} } from "react-native-web/dist/index";`;
            })
          );
        }
      ),
      nox.defineVisitor(
        'VariableDeclaration',
        {
          fields: ['kind'],
          children: {
            declarations: {
              route: 'VariableDeclarator',
              children: {
                id: {
                  route: 'Identifier|ObjectPattern|ArrayPattern',
                  fields: ['name'],
                  children: {
                    properties: {
                      route: 'BindingProperty|BindingRestElement',
                      fields: ['key', 'computed', 'shorthand'],
                      children: {
                        value: {
                          route: 'Identifier|ObjectPattern|ArrayPattern|AssignmentPattern',
                          fields: ['name'],
                        },
                      },
                    },
                  },
                },
                init: {
                  route: 'Expression',
                  fields: ['calleeName', 'calleeGlobal', 'staticArgument'],
                },
              },
            },
          },
        },
        (declaration) => {
          const kind = declaration.node.kind;
          const retained: { getSource(): SourceFragment }[] = [];
          const replacements: Code[] = [];
          let changed = false;

          for (const declarator of declaration.getChildList('declarations')) {
            const id = declarator.getChild('id');
            const init = declarator.getChild('init');
            if (
              !id ||
              init?.node.type !== 'CallExpression' ||
              init.node.calleeName !== 'require' ||
              init.node.calleeGlobal !== true ||
              !isRoot(init.node.staticArgument)
            ) {
              retained.push(declarator);
              continue;
            }

            if (id.node.type === 'Identifier') {
              replacements.push(
                `${kind} ${String(id.node.name)} = require("react-native-web/dist/index");`
              );
              changed = true;
              continue;
            }
            if (id.node.type !== 'ObjectPattern') {
              retained.push(declarator);
              continue;
            }

            const properties = id.getChildList('properties');
            const supported: {
              imported: string;
              local: string;
              source: SourceFragment;
            }[] = [];
            let valid = true;
            for (const property of properties) {
              if (
                property.node.type !== 'BindingProperty' ||
                property.node.computed === true ||
                typeof property.node.key !== 'string'
              ) {
                valid = false;
                break;
              }
              const value = property.getChild('value');
              if (
                !value ||
                value.node.type !== 'Identifier' ||
                typeof value.node.name !== 'string'
              ) {
                valid = false;
                break;
              }
              supported.push({
                imported: property.node.key,
                local: value.node.name,
                source: property.getSource(),
              });
            }
            if (!valid) {
              retained.push(declarator);
              continue;
            }

            const unknown: SourceFragment[] = [];
            for (const property of supported) {
              const location = reactNativeWebLocation(property.imported);
              if (location) {
                replacements.push(
                  `${kind} ${property.local} = require(${JSON.stringify(location)}).default;`
                );
              } else {
                unknown.push(property.source);
              }
            }
            if (unknown.length > 0) {
              const parts: CompositeFragment['parts'][number][] = [`${kind} { `];
              for (const [index, property] of unknown.entries()) {
                if (index > 0) parts.push(', ');
                parts.push(property);
              }
              parts.push(' } = require("react-native-web/dist/index");');
              replacements.push({ kind: 'composite', parts });
            }
            changed = true;
          }

          if (!changed) return;
          if (retained.length > 0) {
            const parts: CompositeFragment['parts'][number][] = [`${kind} `];
            for (const [index, declarator] of retained.entries()) {
              if (index > 0) parts.push(', ');
              parts.push(declarator.getSource());
            }
            parts.push(';');
            replacements.unshift({ kind: 'composite', parts });
          }
          declaration.replaceWithMultiple(replacements);
        }
      ),
    ],
  });
}
