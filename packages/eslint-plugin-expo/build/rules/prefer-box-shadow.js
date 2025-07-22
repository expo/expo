"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferBoxShadow = void 0;
const utils_1 = require("@typescript-eslint/utils");
const createRule = utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`);
exports.preferBoxShadow = createRule({
    name: 'prefer-box-shadow',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Box shadow is a simpler, more consistent way of defining shadows on components. It is recommended for web builds.',
        },
        schema: [],
        messages: {
            preferBoxShadow: 'prefer box shadow',
        },
    },
    defaultOptions: [],
    create(context) {
        const oldShadowProps = [
            'shadowColor',
            'shadowOffset',
            'shadowOpacity',
            'shadowRadius',
            'elevation',
        ];
        return {
            ObjectExpression(node) {
                for (const property of node.properties) {
                    if (property.type === 'Property' &&
                        property.key.type === 'Identifier' &&
                        oldShadowProps.includes(property.key.name)) {
                        context.report({
                            node: property,
                            messageId: 'preferBoxShadow',
                        });
                    }
                }
            },
        };
    },
});
