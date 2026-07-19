import type { types, template } from '@babel/core';

export const defaultWrapHelper = ({ statement }: typeof template, name: string): types.Statement =>
  statement(`
    function %%name%%(e) {
      return e && e.__esModule ? e : { default: e };
    }
  `)({ name });

export const namespaceWrapHelper = (
  { statement }: typeof template,
  name: string
): types.Statement => {
  // NOTE(@kitten): A looser option than the above that matches Metro's legacy behaviour
  return statement(`
    function %%name%%(e) {
      if (e && e.__esModule) return e;
      var n = {};
      if (e) Object.keys(e).forEach(function (k) {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      });
      n.default = e;
      return n;
    }
  `)({ name });
};

export const liveExportAllHelper = (
  { statement }: typeof template,
  id: string
): types.Statement => {
  return statement(`
    Object.keys(%%id%%).forEach(function (k) {
      if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) {
        Object.defineProperty(exports, k, {
          enumerable: true,
          get: function () { return %%id%%[k]; }
        });
      }
    });
  `)({ id });
};

export const liveExportHelper = (
  t: typeof types,
  exportName: string,
  expr: types.Expression
): types.Statement => {
  return t.expressionStatement(
    t.callExpression(t.memberExpression(t.identifier('Object'), t.identifier('defineProperty')), [
      t.identifier('exports'),
      t.stringLiteral(exportName),
      t.objectExpression([
        t.objectProperty(t.identifier('enumerable'), t.booleanLiteral(true)),
        t.objectProperty(
          t.identifier('get'),
          t.functionExpression(null, [], t.blockStatement([t.returnStatement(expr)]))
        ),
      ]),
    ])
  );
};

export const assignExportHelper = (
  t: typeof types,
  exportName: string,
  expr: types.Expression
): types.Statement => {
  if (exportName === '__proto__') {
    // NOTE(@kitten): `exports` is instantiated as `{}` instead of `Object.create(null)`, so the __proto__
    // assignment still carries its special meaning. We switch to the live export helper implicitly here
    // to avoid this
    return liveExportHelper(t, exportName, expr);
  }
  const member = t.isValidIdentifier(exportName)
    ? t.identifier(exportName)
    : t.stringLiteral(exportName);
  return t.expressionStatement(
    t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), member), expr)
  );
};

export const varDeclaratorHelper = (
  t: typeof types,
  name: string,
  expr: types.Expression
): types.Statement =>
  t.variableDeclaration('var', [t.variableDeclarator(t.identifier(name), expr)]);

/** `var %id% = require("%source%");` */
export const requireCall = (
  t: typeof types,
  id: string,
  source: types.StringLiteral
): types.VariableDeclaration =>
  t.variableDeclaration('var', [
    t.variableDeclarator(t.identifier(id), t.callExpression(t.identifier('require'), [source])),
  ]);

/** `require("%source%");` */
export const sideEffectRequireCall = (
  t: typeof types,
  source: types.StringLiteral
): types.Statement => t.expressionStatement(t.callExpression(t.identifier('require'), [source]));

/** `var %id% = %fnName%(%source%);` */
export const varDeclaratorCallHelper = (
  t: typeof types,
  id: string,
  fn: string,
  arg: string
): types.Statement =>
  t.variableDeclaration('var', [
    t.variableDeclarator(t.identifier(id), t.callExpression(t.identifier(fn), [t.identifier(arg)])),
  ]);

// Needs to be kept in 1:1 compatibility with Babel.
export const esModuleExportTemplate = ({ statement }: typeof template): types.Statement => {
  return statement(`
    Object.defineProperty(exports, '__esModule', {value: true});
  `)();
};

export const nullBoundExpression = (
  t: typeof types,
  expr: types.Expression
): types.ParenthesizedExpression =>
  t.parenthesizedExpression(t.sequenceExpression([t.numericLiteral(0), expr]));

function withLocation<TNode extends types.Node>(
  node: TNode,
  loc: types.SourceLocation | null | undefined
): TNode;

function withLocation<TNode extends types.Node>(
  nodeArray: readonly TNode[],
  loc: types.SourceLocation | null | undefined
): TNode[];

function withLocation<TNode extends types.Node>(
  nodeOrArray: TNode | readonly TNode[],
  loc: types.SourceLocation | null | undefined
): TNode | TNode[] {
  if (Array.isArray(nodeOrArray)) {
    return nodeOrArray.map((n) => withLocation(n, loc));
  }
  const node = nodeOrArray as TNode;
  if (!node.loc) {
    node.loc = loc;
  }
  return node;
}

export { withLocation };
