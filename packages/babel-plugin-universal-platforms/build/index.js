"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
function isPlatformSelect(path) {
    return (core_1.types.isMemberExpression(path.node.callee) &&
        core_1.types.isIdentifier(path.node.callee.object) &&
        core_1.types.isIdentifier(path.node.callee.property) &&
        path.node.callee.object.name === 'Platform' &&
        path.node.callee.property.name === 'select' &&
        core_1.types.isObjectExpression(path.node.arguments[0]));
}
const binaryOperations = {
    '&&': (a, b) => a && b,
    '||': (a, b) => a || b,
    '!==': (a, b) => a !== b,
    '===': (a, b) => a === b,
    '!=': (a, b) => a != b,
    '==': (a, b) => a == b,
};
const isLiteral = (node) => core_1.types.isLiteral(node) || (core_1.types.isIdentifier(node) && node.name === 'undefined');
function default_1(api, options) {
    const { platform, mode } = options;
    const isDevelopment = mode !== 'production';
    if (!platform) {
        throw new Error('babel-plugin-universal-platforms: platform option must be defined');
    }
    const collapseTestVisitor = {
        /**
         * Transforms static ID values for Terser to shake
         * `__DEV__ => <true | false>`
         * `__PLATFORM__ => <"ios" | "android" | "web" | string>`
         */
        Identifier(p) {
            // Only transform if the pattern is _not_ being defined.
            // This is important if someone tries to redefine a global.
            if (!core_1.types.isVariableDeclarator(p.parent)) {
                if (p.node.name === '__PLATFORM__') {
                    p.replaceWith(core_1.types.stringLiteral(platform));
                }
                else if (p.node.name === '__DEV__') {
                    p.replaceWith(core_1.types.booleanLiteral(isDevelopment));
                }
            }
        },
        /**
         * Transforms member expressions for Terser to shake
         * `process.env.NODE_ENV => <true | false>`
         * `Platform.OS => <"ios" | "android" | "web" | string>`
         */
        MemberExpression(p) {
            if (!core_1.types.isAssignmentExpression(p.parent)) {
                if (p.matchesPattern('Platform.OS')) {
                    p.replaceWith(core_1.types.stringLiteral(platform));
                }
                else if (p.matchesPattern('process.env.NODE_ENV')) {
                    p.replaceWith(core_1.types.stringLiteral(mode));
                }
            }
        },
        UnaryExpression: {
            /**
             * Transforms redundant boolean expressions
             * `!false => true`
             * `!true => false`
             */
            exit(p) {
                if (p.node.operator === '!' && isLiteral(p.node.argument)) {
                    const literal = p.node.argument;
                    p.replaceWith(core_1.types.booleanLiteral(!literal.value));
                }
            },
        },
        'BinaryExpression|LogicalExpression': {
            exit(p) {
                if (binaryOperations[p.node.operator] &&
                    isLiteral(p.node.left) &&
                    isLiteral(p.node.right)) {
                    p.replaceWith(core_1.types.booleanLiteral(binaryOperations[p.node.operator](p.node.left.value, p.node.right.value)));
                }
                else if (p.node.operator === '&&' &&
                    isLiteral(p.node.left) &&
                    p.node.left.value === false) {
                    p.replaceWith(core_1.types.booleanLiteral(false));
                }
                else if (p.node.operator === '||' &&
                    isLiteral(p.node.left) &&
                    p.node.left.value === true) {
                    p.replaceWith(core_1.types.booleanLiteral(true));
                }
            },
        },
    };
    function destroyBranch(p) {
        // @ts-ignore
        core_1.traverse['explode'](collapseTestVisitor);
        // @ts-ignore
        core_1.traverse['node'](p.node, collapseTestVisitor, p.scope, undefined, p, {
            consequent: true,
            alternate: true,
        });
        if (p.node.test.type === 'BooleanLiteral') {
            // leaves a lexical scope, but oh well
            if (p.node.test.value) {
                p.replaceWith(p.node.consequent);
            }
            else if (p.node.alternate) {
                p.replaceWith(p.node.alternate);
            }
            else {
                p.remove();
            }
        }
    }
    return {
        name: 'Remove unused platforms from the Platform module of unimodules/core',
        visitor: {
            IfStatement: destroyBranch,
            ConditionalExpression: destroyBranch,
            // Catch remaining refs such as: console.log("Dev: ", __DEV__);
            Identifier: collapseTestVisitor.Identifier,
            MemberExpression: collapseTestVisitor.MemberExpression,
            CallExpression(path) {
                if (!isPlatformSelect(path)) {
                    return;
                }
                const platformsSpecs = path.node.arguments[0];
                let canStripPlatformSelect = true;
                let targetCase;
                let defaultCase;
                const additionalProperties = [];
                platformsSpecs.properties.forEach(property => {
                    if (core_1.types.isObjectProperty(property) && core_1.types.isIdentifier(property.key)) {
                        if (property.key.name === 'default') {
                            defaultCase = property;
                        }
                        else if (property.key.name === platform) {
                            targetCase = property;
                        }
                    }
                    else {
                        canStripPlatformSelect = false;
                        additionalProperties.push(property);
                    }
                });
                // If we got exact mach, we can strip the rest
                if (targetCase) {
                    canStripPlatformSelect = true;
                }
                if (!targetCase && !defaultCase && canStripPlatformSelect) {
                    path.replaceWithSourceString('undefined');
                }
                else if (canStripPlatformSelect && (targetCase || defaultCase)) {
                    path.replaceWith((targetCase || defaultCase).value);
                }
                else {
                    platformsSpecs.properties = [targetCase || defaultCase, ...additionalProperties].filter(Boolean);
                }
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map