import { NodePath, traverse, types as t } from '@babel/core';

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

export type UniversalPlatformPluginOptions = {
  platform: string;
  mode: string;
};

export default function(api: any, options: UniversalPlatformPluginOptions) {
  const { platform, mode } = options;
  const isDevelopment = mode !== 'production';
  if (!platform) {
    throw new Error('babel-plugin-react-native-platform: "platform" option must be defined');
  }

  const collapseTestVisitor = {
    /**
     * Transforms static ID values for Terser to analyze
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
     * Transforms member expressions for Terser to analyze
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
    name: 'Remove unused platforms from the Platform module of react-native',
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
