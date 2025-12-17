/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Optimized version of Metro's normalizePseudoGlobals that does all renames
 * in a single AST pass instead of one traversal per pseudo-global.
 */
import type { NodePath } from '@babel/core';
import traverse from '@babel/traverse';
import type { File, Program } from '@babel/types';
import assert from 'node:assert';

export interface Options {
  readonly reservedNames?: ReadonlyArray<string>;
}

function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

export default function normalizePseudoGlobals(
  ast: File,
  options?: Options
): string[] {
  const reservedNames = new Set<string>(options?.reservedNames ?? []);
  const renamedParamNames: string[] = [];

  traverse(ast, {
    Program(path: NodePath<Program>): void {
      const params = path.get('body.0.expression.arguments.0.params');
      const body = path.get('body.0.expression.arguments.0.body');

      if (!body || Array.isArray(body) || !Array.isArray(params)) {
        path.stop();
        return;
      }

      const scope = body.scope;

      const pseudoglobals = params
        .map((path) => ('name' in path.node ? path.node.name : undefined))
        .filter((name): name is string => name !== undefined && !reservedNames.has(name));

      const usedShortNames = new Set<string>();

      // Build rename map: oldName -> newName
      const renameMap = new Map<string, string>();

      for (const fullName of pseudoglobals) {
        const shortName = getShortName(fullName, usedShortNames);

        if (reservedNames.has(shortName)) {
          throw new ReferenceError(
            'Could not reserve the identifier ' +
              shortName +
              ' because it is the short name for ' +
              fullName
          );
        }

        // Check for conflicts and generate unique name if needed
        let unusedName = shortName;
        if (
          scope.hasLabel(shortName) ||
          scope.hasBinding(shortName) ||
          scope.hasGlobal(shortName) ||
          scope.hasReference(shortName)
        ) {
          unusedName = scope.generateUid(shortName);
          const programScope = scope.getProgramParent();
          nullthrows(programScope.references)[shortName] = true;
          nullthrows(programScope.uids)[shortName] = true;
        }

        renameMap.set(fullName, unusedName);
        renamedParamNames.push(unusedName);
      }

      // Rename parameter nodes directly
      for (const paramPath of params) {
        if ('name' in paramPath.node) {
          const oldName = paramPath.node.name;
          const newName = renameMap.get(oldName);
          if (newName) {
            paramPath.node.name = newName;
          }
        }
      }

      // Single traversal to rename all identifiers that reference the parameter bindings
      body.traverse({
        Identifier(identPath) {
          const oldName = identPath.node.name;
          const newName = renameMap.get(oldName);
          if (newName && identPath.isReferencedIdentifier()) {
            // Check if this identifier actually references the parameter binding
            // (not a shadowed local binding)
            const binding = identPath.scope.getBinding(oldName);
            if (binding && binding.scope === scope) {
              identPath.node.name = newName;
            }
          }
        },
      });

      // Update scope bindings
      for (const [fullName, unusedName] of renameMap) {
        const binding = scope.getBinding(fullName);
        if (binding) {
          scope.removeBinding(fullName);
          // @ts-expect-error: internal Babel API
          scope.bindings[unusedName] = binding;
          binding.identifier.name = unusedName;
        }
      }

      path.stop();
    },
  });

  return renamedParamNames;
}

function getShortName(fullName: string, usedNames: Set<string>): string {
  // Try finding letters that are semantically relatable to the name
  // of the variable given. For instance, in XMLHttpRequest, it will
  // first match "X", then "H", then "R".
  const regexp = /^[^A-Za-z]*([A-Za-z])|([A-Z])[a-z]|([A-Z])[A-Z]+$/g;
  let match;

  while ((match = regexp.exec(fullName))) {
    const name = (match[1] || match[2] || match[3] || '').toLowerCase();

    if (!name) {
      throw new ReferenceError('Could not identify any valid name for ' + fullName);
    }

    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }

  throw new ReferenceError(
    `Unable to determine short name for ${fullName}. The variables are not unique: ${Array.from(
      usedNames
    ).join(', ')}`
  );
}
