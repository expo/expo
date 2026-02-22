"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverDataLoadersPlugin = serverDataLoadersPlugin;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:server-data-loaders');
const LOADER_EXPORT_NAME = 'loader';
function serverDataLoadersPlugin(api) {
    const { types: t } = api;
    const routerAbsoluteRoot = api.caller(common_1.getExpoRouterAbsoluteAppRoot);
    const isLoaderBundle = api.caller(common_1.getIsLoaderBundle);
    return {
        name: 'expo-server-data-loaders',
        visitor: {
            ExportDefaultDeclaration(path, state) {
                // Early exit if file is not within the `app/` directory
                if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
                    return;
                }
                // Only remove default exports in loader-only bundles
                if (!isLoaderBundle) {
                    return;
                }
                debug('Loader bundle: removing default export from', state.file.opts.filename);
                markForConstantFolding(state);
                path.remove();
            },
            ExportNamedDeclaration(path, state) {
                // Early exit if file is not within the `app/` directory
                if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
                    debug('Skipping file outside app directory:', state.file.opts.filename);
                    return;
                }
                debug(`Processing ${isLoaderBundle ? 'loader' : 'client'} bundle:`, state.file.opts.filename);
                const { declaration, specifiers } = path.node;
                // Is this a type export like `export type Foo`?
                const isTypeExport = path.node.exportKind === 'type';
                // NOTE(@hassankhan): We should add proper handling for specifiers too
                const hasSpecifiers = specifiers.length > 0;
                if (isTypeExport || hasSpecifiers) {
                    return;
                }
                // Handles `export function loader() { ... }`
                if (t.isFunctionDeclaration(declaration)) {
                    const name = declaration.id?.name;
                    if (name && isLoaderIdentifier(name)) {
                        // Mark the file as having a loader (for all bundle types)
                        markWithLoaderReference(state);
                        if (!isLoaderBundle) {
                            // Client bundles: remove loader
                            debug('Found and removed loader function declaration');
                            markForConstantFolding(state);
                            path.remove();
                        }
                        // Loader bundle: keep the loader
                    }
                    else if (name && isLoaderBundle) {
                        // Loader bundle: remove non-loader function declarations
                        debug('Loader bundle: removing non-loader function declaration:', name);
                        markForConstantFolding(state);
                        path.remove();
                    }
                }
                // Handles `export const loader = ...`
                if (t.isVariableDeclaration(declaration)) {
                    let hasModified = false;
                    // Check if any declaration is a loader
                    const hasLoaderDeclaration = declaration.declarations.some((declarator) => {
                        const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
                        return name && isLoaderIdentifier(name);
                    });
                    // Mark the file as having a loader (for all bundle types)
                    if (hasLoaderDeclaration) {
                        markWithLoaderReference(state);
                    }
                    if (isLoaderBundle) {
                        // Loader bundle: keep only loader declarations, remove others
                        declaration.declarations = declaration.declarations.filter((declarator) => {
                            const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
                            if (name && !isLoaderIdentifier(name)) {
                                debug('Loader bundle: removing non-loader variable declaration:', name);
                                hasModified = true;
                                return false;
                            }
                            return true;
                        });
                    }
                    else {
                        // Client bundles: remove loader declarations
                        declaration.declarations = declaration.declarations.filter((declarator) => {
                            const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
                            if (name && isLoaderIdentifier(name)) {
                                debug('Found and removed loader variable declaration');
                                hasModified = true;
                                return false;
                            }
                            return true;
                        });
                    }
                    if (hasModified) {
                        markForConstantFolding(state);
                        // If all declarations were removed, remove the export
                        if (declaration.declarations.length === 0) {
                            path.remove();
                        }
                    }
                }
            },
        },
    };
}
/**
 * Checks if identifier name is `loader`
 */
function isLoaderIdentifier(name) {
    return name === LOADER_EXPORT_NAME;
}
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
/**
 * Check if file is within the `app/` directory
 */
function isInAppDirectory(filePath, routerRoot) {
    const normalizedFilePath = (0, common_1.toPosixPath)(filePath);
    const normalizedAppRoot = (0, common_1.toPosixPath)(routerRoot);
    return normalizedFilePath.startsWith(normalizedAppRoot + '/');
}
/**
 * Marks a file for Metro's constant folding. This will work for both development and production bundles.
 *
 * @see packages/@expo/metro-config/src/transform-worker/metro-transform-worker.ts#transformJS
 */
function markForConstantFolding(state) {
    assertExpoMetadata(state.file.metadata);
    state.file.metadata.performConstantFolding = true;
}
/**
 * Sets the `loaderReference` metadata to the file path. This is used to collect all modules with
 * loaders in the Metro serializer.
 */
function markWithLoaderReference(state) {
    assertExpoMetadata(state.file.metadata);
    state.file.metadata.loaderReference = state.file.opts.filename ?? undefined;
}
