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
      SafeAreaView: 'react-native-safe-area-context',
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

            const remainingImports = node.specifiers
              .filter((specifier) => !importsToChange.includes(specifier.imported.name))
              .map((specifier) => specifier.imported.name);

            context.report({
              node,
              message: `Import ${oxfordComma(importsToChange)} from ${oxfordComma([
                ...new Set(importsToChange.map((name) => `'${recommendations[name]}'`)),
              ])} instead of '${targetPackage}'`,
              fix(fixer) {
                // Existing import statements from the recommended sources
                const existingImportStatements = context
                  .getSourceCode()
                  .ast.body.filter(
                    (n) =>
                      n.type === 'ImportDeclaration' &&
                      Object.values(recommendations).includes(n.source.value)
                  );

                // Create a map of existing import specifiers for each source
                const existingImportSpecifiers = {};
                existingImportStatements.forEach((n) => {
                  existingImportSpecifiers[n.source.value] = n.specifiers
                    .filter((specifier) => specifier.type === 'ImportSpecifier')
                    .map((specifier) => specifier.imported.name);
                });

                // Array to hold fixer operations
                const fixerOperations = [];

                // Create new import statements or modify existing ones
                Object.keys(newTextGroups).forEach((source) => {
                  if (existingImportSpecifiers[source]) {
                    // If there's an existing import statement, add new imports to it
                    const importNames = Array.from(
                      new Set([...existingImportSpecifiers[source], ...newTextGroups[source]])
                    );
                    const existingImportStatement = existingImportStatements.find(
                      (n) => n.source.value === source
                    );
                    // Create a fixer replacement operation for the modified import statement
                    fixerOperations.push(
                      fixer.replaceText(
                        existingImportStatement,
                        `import { ${importNames.join(', ')} } from '${source}';`
                      )
                    );
                  } else {
                    // If there's no existing import statement, create a new one
                    const newImportStatement = `import { ${newTextGroups[source].join(
                      ', '
                    )} } from '${source}';`;
                    // Always add a newline at the end of new import statements
                    const newText = newImportStatement + '\n';
                    fixerOperations.push(fixer.insertTextBefore(node, newText));
                  }
                });

                // Replace the original import statement with remaining imports (if any)
                if (remainingImports.length > 0) {
                  fixerOperations.push(
                    fixer.replaceText(
                      node,
                      `import { ${remainingImports.join(', ')} } from '${targetPackage}';`
                    )
                  );
                } else {
                  // If no remaining imports, remove the original import statement
                  fixerOperations.push(fixer.remove(node));
                }

                return fixerOperations;
              },
            });
          }
        }
      },
    };
  },
};
