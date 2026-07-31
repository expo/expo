'use strict';
// Analyze a transformed module's dependency references via an AST pass over
// the OUTPUT code (a second, config-free babel pass). Returns:
//   names: require("literal") specifiers in first-appearance order. A string
//     literal that merely contains `require("x")` is NOT a call and is ignored
//     (a regex would wrongly include it). Only free `require` calls count.
//   unsupported: constructs the on-device require shim / Hermes can't handle,
//     so the applier must REFUSE rather than emit a broken patch:
//       - dynamic import() — babel-preset-expo leaves it (Metro normally lowers
//         it); Hermes rejects import() at parse time, failing the whole bundle.
//       - require.context / require.<member>(...) — the shim only maps
//         require("name"); a member call would hit the wrong path or a missing
//         method at runtime.
function analyzeRequires(code, transformSync) {
  const seen = new Set();
  const names = [];
  const unsupported = new Set();
  transformSync(code, {
    babelrc: false,
    configFile: false,
    sourceType: 'script',
    code: false,
    plugins: [
      {
        visitor: {
          Import() {
            unsupported.add('dynamic import()');
          },
          CallExpression(pathNode) {
            const callee = pathNode.node.callee;
            if (
              callee.type === 'MemberExpression' &&
              callee.object.type === 'Identifier' &&
              callee.object.name === 'require' &&
              !pathNode.scope.hasBinding('require')
            ) {
              const prop = callee.property.name || callee.property.value || 'member';
              unsupported.add('require.' + prop + '()');
              return;
            }
            if (
              callee.type === 'Identifier' &&
              callee.name === 'require' &&
              !pathNode.scope.hasBinding('require')
            ) {
              const arg = pathNode.node.arguments[0];
              if (pathNode.node.arguments.length === 1 && arg && arg.type === 'StringLiteral') {
                if (!seen.has(arg.value)) {
                  seen.add(arg.value);
                  names.push(arg.value);
                }
              } else {
                unsupported.add('dynamic require(expression)');
              }
            }
          },
        },
      },
    ],
  });
  return { names, unsupported: [...unsupported] };
}

// Back-compat helper: names only.
function collectRequireNames(code, transformSync) {
  return analyzeRequires(code, transformSync).names;
}

module.exports = { analyzeRequires, collectRequireNames };
