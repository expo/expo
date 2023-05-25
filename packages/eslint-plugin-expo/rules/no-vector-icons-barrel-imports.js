const { oxfordComma } = require('./utils/oxford-comma');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce default import style for @expo/vector-icons',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const targetPackage = '@expo/vector-icons';

    return {
      CallExpression(node) {
        if (
          node.callee.name === 'require' &&
          node.arguments[0] &&
          node.arguments[0].value === '@expo/vector-icons'
        ) {
          context.report({
            node,
            message:
              'Avoid empty require of @expo/vector-icons. Specify the modules you want to require.',
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const semicolonToken = sourceCode.getTokenAfter(node);
              if (semicolonToken && semicolonToken.value === ';') {
                return fixer.removeRange([node.range[0], semicolonToken.range[1]]);
              }
              return fixer.remove(node);
            },
          });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value === '@expo/vector-icons' && node.specifiers.length === 0) {
          context.report({
            node,
            message:
              'Avoid empty import of @expo/vector-icons. Specify the modules you want to import.',
            fix(fixer) {
              return fixer.remove(node);
            },
          });
        }

        if (node.source.value === targetPackage) {
          let importsToChange = [];
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportSpecifier') {
              importsToChange.push(specifier.imported.name);
            }
          });

          if (importsToChange.length > 0) {
            // Group the new imports by their recommended source module.
            const newTextGroups = {};
            importsToChange.forEach((name) => {
              const source = `@expo/vector-icons/${name}`;
              if (!newTextGroups[source]) {
                newTextGroups[source] = [];
              }
              newTextGroups[source].push(name);
            });

            const newText = Object.keys(newTextGroups)
              .map((source) => `import ${newTextGroups[source]} from '${source}';`)
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
              message: `Import ${oxfordComma(importsToChange)} directly to reduce app size`,
              fix(fixer) {
                return [
                  fixer.replaceTextRange([node.range[0], node.range[1]], remainingText),
                  fixer.insertTextBefore(node, newText),
                  // fixer.insertTextBefore(node, newText + '\n'),
                ];
              },
            });
          }
        }
      },
    };
  },
};
