"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverDataLoadersPlugin = serverDataLoadersPlugin;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:server-data-loaders');
const LOADER_EXPORT_NAME = 'loader';
function serverDataLoadersPlugin(api) {
    const { types: t } = api;
    const routerAbsoluteRoot = api.caller(common_1.getExpoRouterAbsoluteAppRoot);
    const isServer = api.caller(common_1.getIsServer);
    return {
        name: 'expo-server-data-loaders',
        visitor: {
            ExportNamedDeclaration(path, state) {
                if (isServer) {
                    return;
                }
                // Early exit if file is not within the `app/` directory
                if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
                    debug('Skipping file outside app directory:', state.file.opts.filename);
                    return;
                }
                debug(isServer ? 'Processing server bundle:' : 'Processing client bundle:', state.file.opts.filename);
                const { declaration, specifiers } = path.node;
                // Is this a type export like `export type Foo`?
                const isTypeExport = path.node.exportKind === 'type';
                // Does this export with `export { loader }`?
                // NOTE(@hassankhan): We should add proper handling for specifiers too
                const hasSpecifiers = specifiers.length > 0;
                if (isTypeExport || hasSpecifiers) {
                    return;
                }
                // Handles `export function loader() {}`
                if (t.isFunctionDeclaration(declaration)) {
                    const name = declaration.id?.name;
                    if (name && isLoaderIdentifier(name)) {
                        debug('Found and removed loader function declaration');
                        markForConstantFolding(path, state);
                    }
                }
                // Handles `export const loader = ...`
                if (t.isVariableDeclaration(declaration)) {
                    declaration.declarations = declaration.declarations.filter((declarator) => {
                        const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
                        if (name && isLoaderIdentifier(name)) {
                            debug('Found and removed loader variable declaration');
                            return false;
                        }
                        return true;
                    });
                    // If all declarations were removed, remove the export
                    if (declaration.declarations.length === 0) {
                        markForConstantFolding(path, state);
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
function markForConstantFolding(path, state) {
    assertExpoMetadata(state.file.metadata);
    state.file.metadata.performConstantFolding = true;
    path.remove();
}
