const moduleMap = require('./moduleMap');

const getDistLocation = (importName, opts) => {
  if (importName === 'index') {
    return `@expo/vector-icons/build/Icons`;
  } else if (importName && moduleMap[importName]) {
    return `@expo/vector-icons/build/${importName}`;
  }
};

const isReactNativeRequire = (t, node) => {
  const { declarations } = node;
  if (declarations.length > 1) {
    return false;
  }
  const { id, init } = declarations[0];
  return (
    (t.isObjectPattern(id) || t.isIdentifier(id)) &&
    t.isCallExpression(init) &&
    t.isIdentifier(init.callee) &&
    init.callee.name === 'require' &&
    init.arguments.length === 1 &&
    (init.arguments[0].value === '@expo/vector-icons' ||
      init.arguments[0].value === 'react-native-vector-icons')
  );
};

const isReactNativeModule = ({ source, specifiers }) =>
  source &&
  (source.value === '@expo/vector-icons' || source.value === 'react-native-vector-icons') &&
  specifiers.length;

module.exports = function({ types: t }) {
  return {
    name: 'Eliminates unused fonts by redirecting all @expo/vector-icons',
    visitor: {
      ImportDeclaration(path, state) {
        const { specifiers } = path.node;
        if (isReactNativeModule(path.node)) {
          const imports = specifiers
            .map(specifier => {
              if (t.isImportSpecifier(specifier)) {
                const importName = specifier.imported.name;
                const distLocation = getDistLocation(importName, state.opts);

                if (distLocation) {
                  return t.importDeclaration(
                    [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
                    t.stringLiteral(distLocation)
                  );
                }
              }
              return t.importDeclaration(
                [specifier],
                t.stringLiteral(getDistLocation('index', state.opts))
              );
            })
            .filter(Boolean);

          path.replaceWithMultiple(imports);
        }
      },
      ExportNamedDeclaration(path, state) {
        const { specifiers } = path.node;
        if (isReactNativeModule(path.node)) {
          const exports = specifiers
            .map(specifier => {
              if (t.isExportSpecifier(specifier)) {
                const exportName = specifier.exported.name;
                const localName = specifier.local.name;
                const distLocation = getDistLocation(localName, state.opts);

                if (distLocation) {
                  return t.exportNamedDeclaration(
                    null,
                    [t.exportSpecifier(t.identifier('default'), t.identifier(exportName))],
                    t.stringLiteral(distLocation)
                  );
                }
              }
              return t.exportNamedDeclaration(
                null,
                [specifier],
                t.stringLiteral(getDistLocation('index', state.opts))
              );
            })
            .filter(Boolean);

          path.replaceWithMultiple(exports);
        }
      },
      VariableDeclaration(path, state) {
        if (isReactNativeRequire(t, path.node)) {
          const { id } = path.node.declarations[0];
          if (t.isObjectPattern(id)) {
            const imports = id.properties
              .map(identifier => {
                const distLocation = getDistLocation(identifier.key.name, state.opts);
                if (distLocation) {
                  return t.variableDeclaration(path.node.kind, [
                    t.variableDeclarator(
                      t.identifier(identifier.value.name),
                      t.memberExpression(
                        t.callExpression(t.identifier('require'), [t.stringLiteral(distLocation)]),
                        t.identifier('default')
                      )
                    ),
                  ]);
                }
              })
              .filter(Boolean);

            path.replaceWithMultiple(imports);
          } else if (t.isIdentifier(id)) {
            const name = id.name;
            const importIndex = t.variableDeclaration(path.node.kind, [
              t.variableDeclarator(
                t.identifier(name),
                t.callExpression(t.identifier('require'), [
                  t.stringLiteral(getDistLocation('index', state.opts)),
                ])
              ),
            ]);

            path.replaceWith(importIndex);
          }
        }
      },
    },
  };
};
