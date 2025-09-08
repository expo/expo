"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importExportLiveBindingsPlugin = importExportLiveBindingsPlugin;
const helpers_1 = require("./helpers");
function importExportLiveBindingsPlugin({ template, types: t, }) {
    const addModuleSpecifiers = (state, source) => {
        let moduleSpecifiers = state.importSpecifiers.get(source.value);
        if (!moduleSpecifiers) {
            moduleSpecifiers = Object.create(null);
            state.importSpecifiers.set(source.value, moduleSpecifiers);
        }
        return moduleSpecifiers;
    };
    const addImport = (path, state, source) => {
        const moduleSpecifiers = addModuleSpecifiers(state, source);
        moduleSpecifiers.sideEffect = true;
        let id = moduleSpecifiers["REQUIRE" /* ImportDeclarationKind.REQUIRE */];
        if (!id) {
            id = path.scope.generateUid(source.value);
            moduleSpecifiers["REQUIRE" /* ImportDeclarationKind.REQUIRE */] = id;
            state.importDeclarations.push({
                kind: "REQUIRE" /* ImportDeclarationKind.REQUIRE */,
                local: undefined,
                source,
                loc: path.node.loc,
            });
        }
        return id;
    };
    const addDefaultImport = (path, state, source, name) => {
        const moduleSpecifiers = addModuleSpecifiers(state, source);
        let id = moduleSpecifiers["DEFAULT" /* ImportDeclarationKind.IMPORT_DEFAULT */];
        if (!id) {
            // Use the given name, if possible, or generate one. If no initial name is given,
            // we'll create one based on the parent import
            const parentImportLocal = addImport(path, state, source);
            id =
                !name || !t.isValidIdentifier(name)
                    ? path.scope.generateUid(name ?? parentImportLocal)
                    : name;
            moduleSpecifiers["DEFAULT" /* ImportDeclarationKind.IMPORT_DEFAULT */] = id;
            state.importDeclarations.push({
                kind: "DEFAULT" /* ImportDeclarationKind.IMPORT_DEFAULT */,
                local: parentImportLocal,
                source,
                loc: path.node.loc,
            });
        }
        return id;
    };
    const addNamespaceImport = (path, state, source, name) => {
        const moduleSpecifiers = addModuleSpecifiers(state, source);
        let id = moduleSpecifiers["NAMESPACE" /* ImportDeclarationKind.IMPORT_NAMESPACE */];
        if (!id) {
            // Use the given name, if possible, or generate one. If no initial name is given,
            // we'll create one based on the parent import
            const parentImportLocal = addImport(path, state, source);
            id =
                !name || !t.isValidIdentifier(name)
                    ? path.scope.generateUid(name ?? parentImportLocal)
                    : name;
            moduleSpecifiers["NAMESPACE" /* ImportDeclarationKind.IMPORT_NAMESPACE */] = id;
            state.importDeclarations.push({
                kind: "NAMESPACE" /* ImportDeclarationKind.IMPORT_NAMESPACE */,
                local: parentImportLocal,
                source,
                loc: path.node.loc,
            });
        }
        return id;
    };
    return {
        visitor: {
            // (1): Scan imports and prepare require calls
            ImportDeclaration(path, state) {
                if (path.node.importKind && path.node.importKind !== 'value') {
                    path.remove();
                    return;
                }
                const source = path.node.source;
                if (!path.node.specifiers.length) {
                    addImport(path, state, source);
                    path.remove();
                    return;
                }
                for (const specifier of path.node.specifiers) {
                    const localId = specifier.local.name;
                    let importId;
                    let member;
                    switch (specifier.type) {
                        case 'ImportNamespaceSpecifier':
                            // The `namespaceWrapHelper` ensures a namespace object, but namespaces are accessed directly
                            member = undefined;
                            importId = addNamespaceImport(path, state, source, localId);
                            break;
                        case 'ImportSpecifier':
                            if (specifier.importKind && specifier.importKind !== 'value') {
                                continue;
                            }
                            member = t.isIdentifier(specifier.imported)
                                ? specifier.imported.name
                                : specifier.imported.value;
                            // An imported default specifier is the same as an ImportDefaultSpecifier
                            importId =
                                member === 'default'
                                    ? addDefaultImport(path, state, source, localId)
                                    : addImport(path, state, source);
                            break;
                        case 'ImportDefaultSpecifier':
                            // The `defaultWrapHelper` works by wrapping CommonJS modules in a fake module wrapper
                            member = 'default';
                            importId = addDefaultImport(path, state, source, localId);
                            break;
                    }
                    state.inlineBodyRefs.set(localId, {
                        parentId: importId,
                        member,
                    });
                }
                path.remove();
            },
            // (2.1): Declare live exports for ExportAllDeclarations immediately (References the import)
            ExportAllDeclaration(path, state) {
                if (path.node.exportKind && path.node.exportKind !== 'value') {
                    path.remove();
                    return;
                }
                const loc = path.node.loc;
                const source = path.node.source;
                const importId = addImport(path, state, source);
                if (!state.exportAll.has(importId)) {
                    state.referencedLocals.add(importId);
                    state.exportAll.set(importId, (0, helpers_1.withLocation)((0, helpers_1.liveExportAllHelper)(template, importId), loc));
                }
                path.remove();
            },
            // (2.2): Store ExportDefaultDeclaration for later, for processing after all imports are evaluated
            ExportDefaultDeclaration(path, state) {
                if (path.node.exportKind && path.node.exportKind !== 'value') {
                    path.remove();
                    return;
                }
                let localId;
                // We purposefully don't check for `Identifier` or `MemberExpression` here
                // `export default` values are assigne at the point they're declared. We don't want them to be mutated
                if (t.isDeclaration(path.node.declaration)) {
                    if (!path.node.declaration.id) {
                        path.node.declaration.id = path.scope.generateUidIdentifierBasedOnNode(path.node.declaration);
                    }
                    localId = path.node.declaration.id.name;
                    path.replaceWith(path.node.declaration);
                }
                else {
                    localId = path.scope.generateUid('_default');
                    path.replaceWith((0, helpers_1.withLocation)((0, helpers_1.varDeclaratorHelper)(t, localId, path.node.declaration), path.node.loc));
                }
                state.exportDeclarations.push({
                    statement: (0, helpers_1.withLocation)((0, helpers_1.liveExportHelper)(t, 'default', t.identifier(localId)), path.node.loc),
                    local: undefined,
                });
            },
            // (2.3): Store ExportNamedDeclaration for later (if it has a local declaration), for processing after all imports are evaluated
            // - If we have a source, create live bindings immediately for specifiers (References the import)
            ExportNamedDeclaration(path, state) {
                if (path.node.exportKind && path.node.exportKind !== 'value') {
                    path.remove();
                    return;
                }
                else if (path.node.declaration || !path.node.source) {
                    state.exportStatements.push(path.node);
                    if (path.node.declaration) {
                        // If we have a declaration, we'll replace the export with it
                        // In (3.1), we can then refer to the declarations by their local ids
                        path.replaceWith(path.node.declaration);
                        path.skip();
                        if (!path.node.source) {
                            return;
                        }
                    }
                    else if (!path.node.source) {
                        path.remove();
                        return;
                    }
                }
                const source = path.node.source;
                if (!path.node.specifiers.length) {
                    addImport(path, state, source);
                    path.remove();
                    return;
                }
                for (const specifier of path.node.specifiers) {
                    let importId;
                    let specifierLocal;
                    let exportExpression;
                    switch (specifier.type) {
                        case 'ExportNamespaceSpecifier':
                            // The `namespaceWrapHelper` ensures a namespace object, but namespaces are accessed directly
                            specifierLocal = undefined;
                            importId = addNamespaceImport(path, state, source);
                            exportExpression = t.identifier(importId);
                            break;
                        case 'ExportSpecifier':
                            if (specifier.exportKind && specifier.exportKind !== 'value') {
                                continue;
                            }
                            specifierLocal = specifier.local.name;
                            // An imported default specifier is the same as an ImportDefaultSpecifier
                            importId =
                                specifierLocal === 'default'
                                    ? addDefaultImport(path, state, source)
                                    : addImport(path, state, source);
                            exportExpression = t.memberExpression(t.identifier(importId), t.identifier(specifierLocal));
                            break;
                        case 'ExportDefaultSpecifier':
                            // The `defaultWrapHelper` works by wrapping CommonJS modules in a fake module wrapper
                            specifierLocal = 'default';
                            importId = addDefaultImport(path, state, source);
                            exportExpression = t.memberExpression(t.identifier(importId), t.identifier(specifierLocal));
                            break;
                    }
                    const exportName = t.isIdentifier(specifier.exported)
                        ? specifier.exported.name
                        : specifier.exported.value;
                    state.referencedLocals.add(importId);
                    state.exportDeclarations.push({
                        statement: (0, helpers_1.withLocation)((0, helpers_1.liveExportHelper)(t, exportName, exportExpression), path.node.loc),
                        local: importId,
                    });
                }
                path.remove();
            },
            Program: {
                // (0): Initialize all state
                enter(path, state) {
                    state.importSpecifiers = new Map();
                    state.inlineBodyRefs = new Map();
                    state.referencedLocals = new Set();
                    state.exportStatements = [];
                    state.exportDeclarations = [];
                    state.exportAll = new Map();
                    state.importDeclarations = [];
                    // Ensure the iife "globals" don't have conflicting variables in the module.
                    ['global', 'require', 'module', 'exports'].forEach((name) => {
                        path.scope.rename(name, path.scope.generateUidIdentifier(name).name);
                    });
                },
                exit(path, state) {
                    function getInlineRefExpression(node, localId) {
                        const inlineRef = state.inlineBodyRefs.get(localId);
                        if (!inlineRef)
                            return undefined;
                        // Reference count the target ID to ensure its import will be added,
                        // then replace this ID with the InlineRef
                        state.referencedLocals.add(inlineRef.parentId);
                        node.name = inlineRef.parentId;
                        let refNode;
                        if (inlineRef.member == null) {
                            refNode = node;
                        }
                        else if (node.type !== 'JSXIdentifier') {
                            refNode = t.memberExpression(node, t.identifier(inlineRef.member));
                        }
                        else {
                            refNode = t.jsxMemberExpression(t.jsxIdentifier(inlineRef.parentId), t.jsxIdentifier(inlineRef.member));
                        }
                        return refNode;
                    }
                    // (3): Process all "deferred" export declarations in `state.exportDeclarations`
                    for (const exportStatement of state.exportStatements) {
                        // (3.1): Convert all local exports into export declarations, while making sure
                        // to reference imports if necessary
                        if (!exportStatement.source && exportStatement.specifiers) {
                            for (const specifier of exportStatement.specifiers) {
                                if (specifier.type !== 'ExportSpecifier') {
                                    continue; // NOTE: This is not a legal AST type without `source`
                                }
                                else if (specifier.exportKind && specifier.exportKind !== 'value') {
                                    continue;
                                }
                                const exportName = t.isIdentifier(specifier.exported)
                                    ? specifier.exported.name
                                    : specifier.exported.value;
                                const exportExpression = getInlineRefExpression(specifier.local, specifier.local.name) ?? specifier.local;
                                state.exportDeclarations.push({
                                    statement: (0, helpers_1.withLocation)((0, helpers_1.liveExportHelper)(t, exportName, exportExpression), exportStatement.loc),
                                    local: undefined,
                                });
                            }
                        }
                        // (3.2): Process all locally exported declarations
                        const declaration = exportStatement.declaration;
                        if (declaration) {
                            // Live bindings are used for variables, since they can be reassigned and may not be declared until later on
                            const exportHelper = declaration.type === 'VariableDeclaration' ||
                                declaration.type !== 'FunctionDeclaration'
                                ? helpers_1.liveExportHelper
                                : helpers_1.assignExportHelper;
                            const exportBindings = t.getBindingIdentifiers(declaration, false, true);
                            for (const exportName in exportBindings) {
                                state.exportDeclarations.push({
                                    statement: (0, helpers_1.withLocation)(exportHelper(t, exportName, t.identifier(exportBindings[exportName].name)), exportStatement.loc),
                                    local: undefined,
                                });
                            }
                        }
                    }
                    // (4): Traverse reference identifiers and replace as needed with `state.inlineBodyRefs`'
                    // synthetic IDs, while marking the IDs that are referenced in `state.syntheticRefs`
                    path.traverse({
                        ReferencedIdentifier(path, state) {
                            if (path.parent.type === 'ExportSpecifier') {
                                return;
                            }
                            const localId = path.node.name;
                            // We skip this identifier if it's not a program binding, since
                            // that means it was declared in a child scope
                            const localBinding = path.scope.getBinding(localId);
                            const rootBinding = state.programScope.getBinding(localId);
                            if (rootBinding !== localBinding)
                                return;
                            // Replace the local ID with the inlined reference, if there is one
                            let inlineRefExpression = getInlineRefExpression(path.node, localId);
                            if (inlineRefExpression) {
                                // NOTE(@kitten): Ensure that calls after this member access aren't implicitly bound
                                // to the object they're called on
                                if (path.parent.type === 'CallExpression' &&
                                    path.parent.callee === path.node &&
                                    inlineRefExpression.type !== 'JSXMemberExpression') {
                                    inlineRefExpression = (0, helpers_1.nullBoundExpression)(t, inlineRefExpression);
                                }
                                path.replaceWith(inlineRefExpression);
                                path.skip();
                            }
                        },
                    }, {
                        referencedLocals: state.referencedLocals,
                        inlineBodyRefs: state.inlineBodyRefs,
                        programScope: path.scope,
                    });
                    const preambleStatements = [];
                    const esmStatements = [];
                    let _defaultWrapName;
                    const wrapDefault = (localId, sourceId) => {
                        if (!_defaultWrapName) {
                            _defaultWrapName = '_interopDefault';
                            preambleStatements.push((0, helpers_1.defaultWrapHelper)(template, _defaultWrapName));
                        }
                        return (0, helpers_1.varDeclaratorCallHelper)(t, localId, _defaultWrapName, sourceId);
                    };
                    let _namespaceWrapName;
                    const wrapNamespace = (localId, sourceId) => {
                        if (!_namespaceWrapName) {
                            _namespaceWrapName = '_interopNamespace';
                            preambleStatements.push((0, helpers_1.namespaceWrapHelper)(template, _namespaceWrapName));
                        }
                        return (0, helpers_1.varDeclaratorCallHelper)(t, localId, _namespaceWrapName, sourceId);
                    };
                    // Add `__esModule` marker if we have any exports
                    if (state.exportDeclarations.length || state.exportAll.size) {
                        preambleStatements.push((0, helpers_1.esModuleExportTemplate)(template));
                    }
                    // (5): Add all exports, and all referenced imports
                    for (const exportDeclaration of state.exportDeclarations) {
                        esmStatements.push(exportDeclaration.statement);
                        if (exportDeclaration.local) {
                            state.referencedLocals.add(exportDeclaration.local);
                        }
                    }
                    // Reference locals that are referenced by import declarations
                    for (const importDeclaration of state.importDeclarations) {
                        // NOTE(@kitten): The first check removes default/namespace import wrappers when they're unused.
                        // This diverges from the previous implementation a lot, and is basically unused local elimination
                        // If we don't want this, this can safely be removed
                        const source = importDeclaration.source;
                        const local = addModuleSpecifiers(state, source)[importDeclaration.kind];
                        if (!local || !state.referencedLocals.has(local)) {
                            continue;
                        }
                        else if (importDeclaration.local) {
                            state.referencedLocals.add(importDeclaration.local);
                        }
                    }
                    // Insert imports, if they're referenced
                    for (const importDeclaration of state.importDeclarations) {
                        const source = importDeclaration.source;
                        const moduleSpecifiers = addModuleSpecifiers(state, source);
                        const local = moduleSpecifiers[importDeclaration.kind];
                        if (!local || !state.referencedLocals.has(local)) {
                            // Don't add imports that aren't referenced, unless they're required for a side-effect
                            // We check for REQUIRE, to make sure we only ever add a single side-effect require
                            if (importDeclaration.kind === "REQUIRE" /* ImportDeclarationKind.REQUIRE */ &&
                                moduleSpecifiers.sideEffect) {
                                esmStatements.push((0, helpers_1.withLocation)((0, helpers_1.sideEffectRequireCall)(t, source), importDeclaration.loc));
                            }
                            continue;
                        }
                        let importStatement;
                        switch (importDeclaration.kind) {
                            case "REQUIRE" /* ImportDeclarationKind.REQUIRE */:
                                importStatement = (0, helpers_1.requireCall)(t, local, source);
                                break;
                            case "DEFAULT" /* ImportDeclarationKind.IMPORT_DEFAULT */:
                                importStatement = wrapDefault(local, importDeclaration.local);
                                break;
                            case "NAMESPACE" /* ImportDeclarationKind.IMPORT_NAMESPACE */:
                                importStatement = wrapNamespace(local, importDeclaration.local);
                                break;
                        }
                        importStatement = (0, helpers_1.withLocation)(importStatement, importDeclaration.loc);
                        esmStatements.push(importStatement);
                        const exportAllStatement = state.exportAll.get(local);
                        if (exportAllStatement != null) {
                            esmStatements.push(exportAllStatement);
                        }
                    }
                    // WARN(@kitten): This isn't only dependent on exports! If we set this to `false` but
                    // added any imports, then those imports will accidentally be shifted back to CJS-mode
                    if (esmStatements.length && state.opts.out) {
                        state.opts.out.isESModule = true;
                    }
                    path.node.body = [...preambleStatements, ...esmStatements, ...path.node.body];
                },
            },
        },
    };
}
//# sourceMappingURL=importExportLiveBindings.js.map