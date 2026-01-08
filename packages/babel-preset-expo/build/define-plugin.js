"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) 2016 Formidable
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const TYPEOF_PREFIX = 'typeof ';
function definePlugin({ types: t, }) {
    /**
     * Replace a node with a given value. If the replacement results in a BinaryExpression, it will be
     * evaluated. For example, if the result of the replacement is `var x = "production" === "production"`
     * The evaluation will make a second replacement resulting in `var x = true`
     */
    function replaceAndEvaluateNode(nodePath, replacement) {
        nodePath.replaceWith(t.valueToNode(replacement));
        if (nodePath.parentPath?.isBinaryExpression()) {
            const result = nodePath.parentPath.evaluate();
            if (result.confident) {
                nodePath.parentPath.replaceWith(t.valueToNode(result.value));
            }
        }
    }
    /** Get the root identifier name from a member expression (e.g., "process" from "process.env.NODE_ENV") */
    function getMemberExpressionRoot(node) {
        let current = node;
        while (t.isMemberExpression(current)) {
            current = current.object;
        }
        return t.isIdentifier(current) ? current.name : null;
    }
    return {
        name: 'expo-define-globals',
        pre() {
            // Pre-process replacements once per file
            const identifiers = new Map();
            const memberPatterns = [];
            const typeofValues = new Map();
            const memberRoots = new Set();
            for (const key of Object.keys(this.opts)) {
                const value = this.opts[key];
                if (key.startsWith(TYPEOF_PREFIX)) {
                    // "typeof window" -> typeofValues["window"]
                    typeofValues.set(key.slice(TYPEOF_PREFIX.length), value);
                }
                else if (key.includes('.')) {
                    // "process.env.NODE_ENV" -> memberPatterns, extract "process" as root
                    memberPatterns.push([key, value]);
                    const root = key.split('.')[0];
                    memberRoots.add(root);
                }
                else {
                    // "__DEV__" -> identifiers
                    identifiers.set(key, value);
                }
            }
            this.processed = {
                identifiers,
                memberPatterns,
                typeofValues,
                memberRoots,
            };
        },
        visitor: {
            // process.env.NODE_ENV;
            MemberExpression(nodePath, state) {
                // Prevent rewriting if the member expression is on the left-hand side of an assignment
                if (t.isAssignmentExpression(nodePath.parent) && nodePath.parent.left === nodePath.node) {
                    return;
                }
                const { memberPatterns, memberRoots } = state.processed;
                if (memberPatterns.length === 0)
                    return;
                // Quick filter: check if root matches any known pattern root
                const root = getMemberExpressionRoot(nodePath.node);
                if (!root || !memberRoots.has(root))
                    return;
                // Check against patterns
                for (const [pattern, replacement] of memberPatterns) {
                    if (nodePath.matchesPattern(pattern)) {
                        replaceAndEvaluateNode(nodePath, replacement);
                        return;
                    }
                }
            },
            // const x = { version: VERSION };
            ReferencedIdentifier(nodePath, state) {
                const { identifiers } = state.processed;
                if (identifiers.size === 0)
                    return;
                const name = nodePath.node.name;
                // Quick check: is this identifier in our replacements?
                if (!identifiers.has(name))
                    return;
                // Check for binding (locally defined variable shadows replacement)
                if (nodePath.scope?.getBinding(name))
                    return;
                // Don't transform import identifiers (mimics webpack's DefinePlugin behavior)
                const container = nodePath.container;
                if (container &&
                    !Array.isArray(container) &&
                    'type' in container &&
                    (container.type === 'ImportDefaultSpecifier' || container.type === 'ImportSpecifier')) {
                    return;
                }
                // Do not transform Object keys / properties unless they are computed like {[key]: value}
                if ((nodePath.key === 'key' || nodePath.key === 'property') &&
                    nodePath.parent &&
                    'computed' in nodePath.parent &&
                    nodePath.parent.computed === false) {
                    return;
                }
                replaceAndEvaluateNode(nodePath, identifiers.get(name));
            },
            // typeof window
            UnaryExpression(nodePath, state) {
                if (nodePath.node.operator !== 'typeof')
                    return;
                const { typeofValues } = state.processed;
                if (typeofValues.size === 0)
                    return;
                const argument = nodePath.node.argument;
                if (!t.isIdentifier(argument))
                    return;
                const replacement = typeofValues.get(argument.name);
                if (replacement !== undefined) {
                    replaceAndEvaluateNode(nodePath, replacement);
                }
            },
        },
    };
}
exports.default = definePlugin;
