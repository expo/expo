module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce default import style for @expo/vector-icons',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code', // or "code" or "whitespace"
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@expo/vector-icons') {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportSpecifier') {
              context.report({
                node,
                message: 'Import {{name}} directly from @expo/vector-icons/{{name}}',
                data: {
                  name: specifier.imported.name,
                },
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `import ${specifier.imported.name} from '@expo/vector-icons/${specifier.imported.name}';`
                  );
                },
              });
            }
          });
        }
      },
    };
  },
};
