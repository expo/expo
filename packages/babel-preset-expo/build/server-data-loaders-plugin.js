"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverDataLoadersPlugin = serverDataLoadersPlugin;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:server-data-loaders');
const LOADER_EXPORT_NAME = 'loader';
function serverDataLoadersPlugin(api) {
    const { types: t } = api;
    const isServer = api.caller(common_1.getIsServer);
    return {
        name: 'expo-server-data-loaders',
        pre(file) {
            // Early exit if file doesn't contain a `loader` named export
            if (!file.code.includes(LOADER_EXPORT_NAME)) {
                debug('Skipping file (no loader export):', file.opts.filename);
                file.path.stop();
                return;
            }
            debug(isServer ? 'Processing server bundle:' : 'Processing client bundle:', file.opts.filename);
        },
        visitor: {
            ExportNamedDeclaration(path, state) {
                if (isServer) {
                    return;
                }
                const { declaration } = path.node;
                // Handles `export function loader() {}`
                if (t.isFunctionDeclaration(declaration)) {
                    const name = declaration.id?.name;
                    if (name && isLoaderIdentifier(name)) {
                        debug('Found and removed loader function declaration');
                        path.remove();
                    }
                }
                // Handles `export const loader = ...`
                if (t.isVariableDeclaration(declaration)) {
                    const originalLength = declaration.declarations.length;
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
