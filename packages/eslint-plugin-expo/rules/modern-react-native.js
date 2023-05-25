const { oxfordComma } = require('./utils/oxford-comma');
// no-rn-image-imports.js
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'recommend alternative imports for react-native modules',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          preserve: {
            type: 'array',
            items: {
              type: 'string',
            },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const disallowedImports = options.preserve || [];

    const recommendations = {
      Linking: 'expo-linking',
      Image: 'expo-image',
      StatusBar: 'expo-status-bar',
      ScrollView: 'react-native-gesture-handler',
      TextInput: 'react-native-gesture-handler',
      RefreshControl: 'react-native-gesture-handler',
      // Maybe flash list?
      FlatList: 'react-native-gesture-handler',
    };
    const targetPackage = 'react-native';

    return {
      ImportDeclaration(node) {
        if (node.source.value === targetPackage) {
          let importsToChange = [];
          node.specifiers.forEach((specifier) => {
            if (
              specifier.type === 'ImportSpecifier' &&
              recommendations[specifier.imported.name] &&
              !disallowedImports.includes(specifier.imported.name)
            ) {
              importsToChange.push(specifier.imported.name);
            }
          });

          if (importsToChange.length > 0) {
            // Group the new imports by their recommended source module.
            const newTextGroups = {};
            importsToChange.forEach((name) => {
              const source = recommendations[name];
              if (!newTextGroups[source]) {
                newTextGroups[source] = [];
              }
              newTextGroups[source].push(name);
            });

            const newText = Object.keys(newTextGroups)
              .map((source) => `import { ${newTextGroups[source].join(', ')} } from '${source}';`)
              .join('\n');

            const remainingImports = node.specifiers
              .filter((specifier) => !importsToChange.includes(specifier.imported.name))
              .map((specifier) => specifier.imported.name);

            const remainingText =
              remainingImports.length > 0
                ? `import { ${remainingImports.join(', ')} } from '${targetPackage}';`
                : '';

            context.report({
              node,
              message: `Import ${oxfordComma(importsToChange)} from ${oxfordComma([
                ...new Set(importsToChange.map((name) => `'${recommendations[name]}'`)),
              ])} instead of '${targetPackage}'`,
              fix(fixer) {
                return [
                  fixer.replaceTextRange([node.range[0], node.range[1]], remainingText),
                  fixer.insertTextBefore(node, newText + '\n'),
                ];
              },
            });
          }
        }
      },
    };
  },
};
