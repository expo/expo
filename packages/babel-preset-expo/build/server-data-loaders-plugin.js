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
                assertExpoMetadata(state.file.metadata);
                if (isServer) {
                    return;
                }
                // Early exit if file is not within the `app/` directory
                if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
                    debug('Skipping file outside app directory:', state.file.opts.filename);
                    return;
                }
                // Early exit if file doesn't contain a `loader` named export
                if (!state.file.code.includes(LOADER_EXPORT_NAME)) {
                    debug('Skipping file:', state.file.opts.filename);
                    state.file.path.stop();
                    return;
                }
                debug(isServer ? 'Processing server bundle:' : 'Processing client bundle:', state.file.opts.filename);
                const { declaration } = path.node;
                // Handles `export function loader() {}`
                if (t.isFunctionDeclaration(declaration)) {
                    const name = declaration.id?.name;
                    if (name && isLoaderIdentifier(name)) {
                        debug('Found and removed loader function declaration');
                        state.file.metadata.performConstantFolding = true;
                        path.remove();
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
                        state.file.metadata.performConstantFolding = true;
                        path.remove();
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
