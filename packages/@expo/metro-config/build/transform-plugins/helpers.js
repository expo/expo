"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullBoundExpression = exports.esModuleExportTemplate = exports.varDeclaratorCallHelper = exports.sideEffectRequireCall = exports.requireCall = exports.varDeclaratorHelper = exports.assignExportHelper = exports.liveExportHelper = exports.liveExportAllHelper = exports.namespaceWrapHelper = exports.strictNamespaceWrapHelper = exports.defaultWrapHelper = void 0;
exports.withLocation = withLocation;
const defaultWrapHelper = ({ statement }, name) => statement(`
    function %%name%%(e) {
      return e && e.__esModule ? e : { default: e };
    }
  `)({ name });
exports.defaultWrapHelper = defaultWrapHelper;
const strictNamespaceWrapHelper = ({ statement }, name) => {
    return statement(`
    function %%name%%(e) {
      if (e && e.__esModule) return e;
      var n = Object.create(null);
      if (e) {
        Object.keys(e).forEach(function (k) {
          if (k !== 'default') {
            var d = Object.getOwnPropertyDescriptor(e, k);
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: function () { return e[k]; }
            });
          }
        });
      }
      n.default = e;
      return Object.freeze(n);
    }
  `)({ name });
};
exports.strictNamespaceWrapHelper = strictNamespaceWrapHelper;
const namespaceWrapHelper = ({ statement }, name) => {
    // NOTE(@kitten): A looser option than the above that matches Metro's legacy behaviour
    return statement(`
    function %%name%%(e) {
      if (e && e.__esModule) return e;
      var n = {};
      if (e) Object.keys(e).forEach(function (k) {
        n[k] = e[k];
      });
      n.default = e;
      return n;
    }
  `)({ name });
};
exports.namespaceWrapHelper = namespaceWrapHelper;
const liveExportAllHelper = ({ statement }, id) => {
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
exports.liveExportAllHelper = liveExportAllHelper;
const liveExportHelper = (t, exportName, expr) => {
    return t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('Object'), t.identifier('defineProperty')), [
        t.identifier('exports'),
        t.stringLiteral(exportName),
        t.objectExpression([
            t.objectProperty(t.identifier('enumerable'), t.booleanLiteral(true)),
            t.objectProperty(t.identifier('get'), t.functionExpression(null, [], t.blockStatement([t.returnStatement(expr)]))),
        ]),
    ]));
};
exports.liveExportHelper = liveExportHelper;
const assignExportHelper = (t, exportName, expr) => {
    if (exportName === '__proto__') {
        // NOTE(@kitten): `exports` is instantiated as `{}` instead of `Object.create(null)`, so the __proto__
        // assignment still carries its special meaning. We switch to the live export helper implicitly here
        // to avoid this
        return (0, exports.liveExportHelper)(t, exportName, expr);
    }
    const member = t.isValidIdentifier(exportName)
        ? t.identifier(exportName)
        : t.stringLiteral(exportName);
    return t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), member), expr));
};
exports.assignExportHelper = assignExportHelper;
const varDeclaratorHelper = (t, name, expr) => t.variableDeclaration('var', [t.variableDeclarator(t.identifier(name), expr)]);
exports.varDeclaratorHelper = varDeclaratorHelper;
/** `var %id% = require("%source%");` */
const requireCall = (t, id, source) => t.variableDeclaration('var', [
    t.variableDeclarator(t.identifier(id), t.callExpression(t.identifier('require'), [source])),
]);
exports.requireCall = requireCall;
/** `require("%source%");` */
const sideEffectRequireCall = (t, source) => t.expressionStatement(t.callExpression(t.identifier('require'), [source]));
exports.sideEffectRequireCall = sideEffectRequireCall;
/** `var %id% = %fnName%(%source%);` */
const varDeclaratorCallHelper = (t, id, fn, arg) => t.variableDeclaration('var', [
    t.variableDeclarator(t.identifier(id), t.callExpression(t.identifier(fn), [t.identifier(arg)])),
]);
exports.varDeclaratorCallHelper = varDeclaratorCallHelper;
// Needs to be kept in 1:1 compatibility with Babel.
const esModuleExportTemplate = ({ statement }) => {
    return statement(`
    Object.defineProperty(exports, '__esModule', {value: true});
  `)();
};
exports.esModuleExportTemplate = esModuleExportTemplate;
const nullBoundExpression = (t, expr) => t.parenthesizedExpression(t.sequenceExpression([t.numericLiteral(0), expr]));
exports.nullBoundExpression = nullBoundExpression;
function withLocation(nodeOrArray, loc) {
    if (Array.isArray(nodeOrArray)) {
        return nodeOrArray.map((n) => withLocation(n, loc));
    }
    const node = nodeOrArray;
    if (!node.loc) {
        node.loc = loc;
    }
    return node;
}
//# sourceMappingURL=helpers.js.map