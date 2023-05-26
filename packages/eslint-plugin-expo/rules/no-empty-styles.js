module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'remove empty style arrays and objects from React Native props',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [],
    fixable: 'code',
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        node.attributes.forEach((attr) => {
          if (attr.name?.name === 'style' && attr.value.expression) {
            const isArrayExpression = attr.value.expression.type === 'ArrayExpression';
            const isObjectExpression = attr.value.expression.type === 'ObjectExpression';

            if (isObjectExpression && attr.value.expression.properties.length === 0) {
              // Empty object
              context.report({
                node: attr,
                message: 'Remove empty style objects',
                fix(fixer) {
                  const rangeStart = attr.range[0];
                  const rangeEnd = attr.range[1];
                  const sourceCode = context.getSourceCode();
                  let whitespaceEnd = rangeEnd;
                  while (sourceCode.text[whitespaceEnd] === ' ') {
                    whitespaceEnd++;
                  }
                  return fixer.removeRange([rangeStart, whitespaceEnd]);
                },
              });
            } else if (isArrayExpression) {
              const elements = attr.value.expression.elements;
              if (elements.length === 0) {
                // Empty array
                context.report({
                  node: attr,
                  message: 'Remove empty style arrays',
                  fix(fixer) {
                    const rangeStart = attr.range[0];
                    const rangeEnd = attr.range[1];
                    const sourceCode = context.getSourceCode();
                    let whitespaceEnd = rangeEnd;
                    while (sourceCode.text[whitespaceEnd] === ' ') {
                      whitespaceEnd++;
                    }
                    return fixer.removeRange([rangeStart, whitespaceEnd]);
                  },
                });
              } else if (elements.length === 1) {
                // Array with a single element
                if (elements[0].type === 'ObjectExpression') {
                  const objectSourceCode = context.getSourceCode().getText(elements[0]);
                  context.report({
                    node: attr,
                    message: 'Replace single-object style arrays with the object',
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `{${objectSourceCode}}`);
                    },
                  });
                } else if (elements[0].type === 'Identifier') {
                  const identifierSourceCode = context.getSourceCode().getText(elements[0]);
                  context.report({
                    node: attr,
                    message: 'Replace single-identifier style arrays with the identifier',
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `{${identifierSourceCode}}`);
                    },
                  });
                } else {
                  console.log('Unknown element type', elements[0].type);
                }
              }
            }
          }
        });
      },
    };
  },
};
