/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) 2016 Formidable
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConfigAPI, PluginObj, PluginPass, NodePath, types as t } from '@babel/core';

const TYPEOF_PREFIX = 'typeof ';

interface ProcessedReplacements {
  /** Identifier name -> replacement value (e.g., "__DEV__" -> false) */
  identifiers: Map<string, unknown>;
  /** Member expression pattern -> replacement value (e.g., "process.env.NODE_ENV" -> "production") */
  memberPatterns: [string, unknown][];
  /** typeof argument name -> replacement value (e.g., "window" -> "object") */
  typeofValues: Map<string, unknown>;
  /** Set of root object names from member patterns for quick filtering (e.g., "process", "Platform") */
  memberRoots: Set<string>;
}

interface DefinePluginState extends PluginPass {
  processed?: ProcessedReplacements;
}

function definePlugin({
  types: t,
}: ConfigAPI & typeof import('@babel/core')): PluginObj<
  PluginPass & { opts: Record<string, null | boolean | string> }
> {
  /**
   * Replace a node with a given value. If the replacement results in a BinaryExpression, it will be
   * evaluated. For example, if the result of the replacement is `var x = "production" === "production"`
   * The evaluation will make a second replacement resulting in `var x = true`
   */
  function replaceAndEvaluateNode(nodePath: NodePath, replacement: unknown) {
    nodePath.replaceWith(t.valueToNode(replacement));

    if (nodePath.parentPath?.isBinaryExpression()) {
      const result = nodePath.parentPath.evaluate();

      if (result.confident) {
        nodePath.parentPath.replaceWith(t.valueToNode(result.value));
      }
    }
  }

  /** Get the root identifier name from a member expression (e.g., "process" from "process.env.NODE_ENV") */
  function getMemberExpressionRoot(node: t.MemberExpression): string | null {
    let current: t.Expression = node;
    while (t.isMemberExpression(current)) {
      current = current.object;
    }
    return t.isIdentifier(current) ? current.name : null;
  }

  return {
    name: 'expo-define-globals',

    pre() {
      // Pre-process replacements once per file
      const identifiers = new Map<string, unknown>();
      const memberPatterns: [string, unknown][] = [];
      const typeofValues = new Map<string, unknown>();
      const memberRoots = new Set<string>();

      for (const key of Object.keys(this.opts)) {
        const value = (this.opts as Record<string, unknown>)[key];

        if (key.startsWith(TYPEOF_PREFIX)) {
          // "typeof window" -> typeofValues["window"]
          typeofValues.set(key.slice(TYPEOF_PREFIX.length), value);
        } else if (key.includes('.')) {
          // "process.env.NODE_ENV" -> memberPatterns, extract "process" as root
          memberPatterns.push([key, value]);
          const root = key.split('.')[0];
          memberRoots.add(root);
        } else {
          // "__DEV__" -> identifiers
          identifiers.set(key, value);
        }
      }

      (this as DefinePluginState).processed = {
        identifiers,
        memberPatterns,
        typeofValues,
        memberRoots,
      };
    },

    visitor: {
      // process.env.NODE_ENV;
      MemberExpression(nodePath, state: DefinePluginState): void {
        // Prevent rewriting if the member expression is on the left-hand side of an assignment
        if (t.isAssignmentExpression(nodePath.parent) && nodePath.parent.left === nodePath.node) {
          return;
        }

        const { memberPatterns, memberRoots } = state.processed!;
        if (memberPatterns.length === 0) return;

        // Quick filter: check if root matches any known pattern root
        const root = getMemberExpressionRoot(nodePath.node);
        if (!root || !memberRoots.has(root)) return;

        // Check against patterns
        for (const [pattern, replacement] of memberPatterns) {
          if (nodePath.matchesPattern(pattern)) {
            replaceAndEvaluateNode(nodePath, replacement);
            return;
          }
        }
      },

      // const x = { version: VERSION };
      ReferencedIdentifier(nodePath, state: DefinePluginState) {
        const { identifiers } = state.processed!;
        if (identifiers.size === 0) return;

        const name = nodePath.node.name;

        // Quick check: is this identifier in our replacements?
        if (!identifiers.has(name)) return;

        // Check for binding (locally defined variable shadows replacement)
        if (nodePath.scope?.getBinding(name)) return;

        // Don't transform import identifiers (mimics webpack's DefinePlugin behavior)
        const container = nodePath.container;
        if (
          container &&
          !Array.isArray(container) &&
          'type' in container &&
          (container.type === 'ImportDefaultSpecifier' || container.type === 'ImportSpecifier')
        ) {
          return;
        }

        // Do not transform Object keys / properties unless they are computed like {[key]: value}
        if (
          (nodePath.key === 'key' || nodePath.key === 'property') &&
          nodePath.parent &&
          'computed' in nodePath.parent &&
          nodePath.parent.computed === false
        ) {
          return;
        }

        replaceAndEvaluateNode(nodePath, identifiers.get(name));
      },

      // typeof window
      UnaryExpression(nodePath, state: DefinePluginState) {
        if (nodePath.node.operator !== 'typeof') return;

        const { typeofValues } = state.processed!;
        if (typeofValues.size === 0) return;

        const argument = nodePath.node.argument;
        if (!t.isIdentifier(argument)) return;

        const replacement = typeofValues.get(argument.name);
        if (replacement !== undefined) {
          replaceAndEvaluateNode(nodePath, replacement);
        }
      },
    },
  };
}

export default definePlugin;
