import { BabelFileMetadata, BabelFileResult, PluginObj } from '@babel/core';

// A babel plugin which collects metadata about import/exports and defines on the BabelFileResult metadata.modules object.
// This info will be used for tree shaking and static extraction.

export function metadataPlugin(): PluginObj {
  return {
    name: 'collect-import-export-metadata',
    visitor: {
      Program: {
        enter(path, state) {
          // Initialize the metadata objects
          state.file.metadata.modules = {
            imports: [],
            exports: [],
          };
        },
      },
      ImportDeclaration(path, state) {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers.map((specifier) => {
          return {
            type: specifier.type,
            importedName: specifier.type === 'ImportSpecifier' ? specifier.imported.name : null,
            localName: specifier.local.name,
          };
        });

        state.file.metadata.modules.imports.push({
          source,
          specifiers,
        });
      },
      ExportNamedDeclaration(path, state) {
        const declaration = path.node.declaration;
        if (declaration) {
          if (declaration.type === 'VariableDeclaration') {
            const specifiers = declaration.declarations.map((declarator) => {
              return declarator.id.name;
            });
            state.file.metadata.modules.exports.push({
              specifiers,
            });
          } else if (declaration.type === 'FunctionDeclaration') {
            state.file.metadata.modules.exports.push({
              specifiers: [declaration.id.name],
            });
          } else if (declaration.type === 'ClassDeclaration') {
            state.file.metadata.modules.exports.push({
              specifiers: [declaration.id.name],
            });
          }
        } else {
          const specifiers = path.node.specifiers.map((specifier) => {
            return specifier.exported.name;
          });
          state.file.metadata.modules.exports.push({
            specifiers,
          });
        }
      },
      ExportDefaultDeclaration(path, state) {
        const declaration = path.node.declaration;
        if (declaration.type === 'Identifier') {
          state.file.metadata.modules.exports.push({
            specifiers: [declaration.name],
          });
        }
      },
    },
  };
}

module.exports = metadataPlugin;
