import { types as t, NodePath, traverse } from '@babel/core';

type ValueLiteral = t.StringLiteral | t.NumericLiteral | t.BooleanLiteral | t.BigIntLiteral;

function isPlatformSelect(path: NodePath<t.CallExpression>): boolean {
  return (
    t.isMemberExpression(path.node.callee) &&
    t.isIdentifier(path.node.callee.object) &&
    t.isIdentifier(path.node.callee.property) &&
    path.node.callee.object.name === 'Platform' &&
    path.node.callee.property.name === 'select' &&
    t.isObjectExpression(path.node.arguments[0])
  );
}

const binaryOperations: { [key: string]: (a: any, b: any) => boolean } = {
  '&&': (a, b) => a && b,
  '||': (a, b) => a || b,
  '!==': (a, b) => a !== b,
  '===': (a, b) => a === b,
  '!=': (a, b) => a != b,
  '==': (a, b) => a == b,
};

const isLiteral = (node: t.Node): boolean =>
  t.isLiteral(node) || (t.isIdentifier(node) && node.name === 'undefined');
// /Literal$/.test(node.type) || (node.type === 'Identifier' && node.name === 'undefined');

export type Options = {
  platform: string;
  mode: string;
};

export default function(api: any, options: Options) {
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
    Identifier(p: NodePath<t.Identifier>) {
      // Only transform if the pattern is _not_ being defined.
      // This is important if someone tries to redefine a global.
      if (!t.isVariableDeclarator(p.parent)) {
        if (p.node.name === '__PLATFORM__') {
          p.replaceWith(t.stringLiteral(platform));
        } else if (p.node.name === '__DEV__') {
          p.replaceWith(t.booleanLiteral(isDevelopment));
        }
      }
    },
    /**
     * Transforms member expressions for Terser to shake
     * `process.env.NODE_ENV => <true | false>`
     * `Platform.OS => <"ios" | "android" | "web" | string>`
     */
    MemberExpression(p: NodePath<t.MemberExpression>) {
      if (!t.isAssignmentExpression(p.parent)) {
        if (p.matchesPattern('Platform.OS')) {
          p.replaceWith(t.stringLiteral(platform));
        } else if (p.matchesPattern('process.env.NODE_ENV')) {
          p.replaceWith(t.stringLiteral(mode));
        }
      }
    },
    UnaryExpression: {
      /**
       * Transforms redundant boolean expressions
       * `!false => true`
       * `!true => false`
       */

      exit(p: NodePath<t.UnaryExpression>) {
        if (p.node.operator === '!' && isLiteral(p.node.argument)) {
          const literal = p.node.argument as ValueLiteral;
          p.replaceWith(t.booleanLiteral(!literal.value));
        }
      },
    },
    'BinaryExpression|LogicalExpression': {
      exit(p: NodePath<t.BinaryExpression | t.LogicalExpression>) {
        if (
          binaryOperations[p.node.operator] &&
          isLiteral(p.node.left) &&
          isLiteral(p.node.right)
        ) {
          p.replaceWith(
            t.booleanLiteral(
              binaryOperations[p.node.operator](
                (p.node.left as ValueLiteral).value,
                (p.node.right as ValueLiteral).value
              )
            )
          );
        } else if (
          p.node.operator === '&&' &&
          isLiteral(p.node.left) &&
          (p.node.left as ValueLiteral).value === false
        ) {
          p.replaceWith(t.booleanLiteral(false));
        } else if (
          p.node.operator === '||' &&
          isLiteral(p.node.left) &&
          (p.node.left as ValueLiteral).value === true
        ) {
          p.replaceWith(t.booleanLiteral(true));
        }
      },
    },
  };

  function destroyBranch(p: NodePath<t.IfStatement | t.ConditionalExpression>) {
    // @ts-ignore
    traverse['explode'](collapseTestVisitor);
    // @ts-ignore
    traverse['node'](p.node, collapseTestVisitor, p.scope, undefined, p, {
      consequent: true,
      alternate: true,
    });

    if (p.node.test.type === 'BooleanLiteral') {
      // leaves a lexical scope, but oh well
      if (p.node.test.value) {
        p.replaceWith(p.node.consequent);
      } else if (p.node.alternate) {
        p.replaceWith(p.node.alternate);
      } else {
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
      CallExpression(path: NodePath<t.CallExpression>) {
        if (!isPlatformSelect(path)) {
          return;
        }
        const platformsSpecs = (path.node.arguments[0] as unknown) as t.ObjectExpression;
        let canStripPlatformSelect = true;
        let targetCase: t.ObjectProperty | undefined;
        let defaultCase: t.ObjectProperty | undefined;
        const additionalProperties: t.ObjectExpression['properties'] = [];
        platformsSpecs.properties.forEach(property => {
          if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
            if (property.key.name === 'default') {
              defaultCase = property;
            } else if (property.key.name === platform) {
              targetCase = property;
            }
          } else {
            canStripPlatformSelect = false;
            additionalProperties.push(property);
          }
        });
        // If we got an exact match, we can strip the rest
        if (targetCase) {
          canStripPlatformSelect = true;
        }
        if (!targetCase && !defaultCase && canStripPlatformSelect) {
          path.replaceWithSourceString('undefined');
        } else if (canStripPlatformSelect && (targetCase || defaultCase)) {
          path.replaceWith((targetCase || defaultCase)!.value as any);
        } else {
          platformsSpecs.properties = [targetCase || defaultCase, ...additionalProperties].filter(
            Boolean
          ) as t.ObjectExpression['properties'];
        }
      },
    },
  };
}
