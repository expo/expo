"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverMetadataPlugin = serverMetadataPlugin;
const common_1 = require("../common");
const debug = require('debug')('expo:babel:server-metadata');
const GENERATE_METADATA_EXPORT_NAME = 'generateMetadata';
function serverMetadataPlugin(api) {
    const { types: t } = api;
    const routerAbsoluteRoot = api.caller(common_1.getExpoRouterAbsoluteAppRoot);
    const isServer = api.caller(common_1.getIsServer);
    return {
        name: 'expo-server-metadata',
        visitor: {
            ExportNamedDeclaration(path, state) {
                if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
                    return;
                }
                if (isServer) {
                    return;
                }
                const { declaration, specifiers } = path.node;
                const isTypeExport = path.node.exportKind === 'type';
                const hasSpecifiers = specifiers.length > 0;
                if (isTypeExport || hasSpecifiers) {
                    return;
                }
                if (t.isFunctionDeclaration(declaration)) {
                    const name = declaration.id?.name;
                    if (name && isGenerateMetadataIdentifier(name)) {
                        debug('Removing generateMetadata function declaration from client bundle');
                        markForConstantFolding(state);
                        path.remove();
                    }
                }
                if (t.isVariableDeclaration(declaration)) {
                    const nextDeclarations = declaration.declarations.filter((declarator) => {
                        const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
                        return !name || !isGenerateMetadataIdentifier(name);
                    });
                    if (nextDeclarations.length !== declaration.declarations.length) {
                        debug('Removing generateMetadata variable declaration from client bundle');
                        markForConstantFolding(state);
                        declaration.declarations = nextDeclarations;
                        if (declaration.declarations.length === 0) {
                            path.remove();
                        }
                    }
                }
            },
        },
    };
}
function isGenerateMetadataIdentifier(name) {
    return name === GENERATE_METADATA_EXPORT_NAME;
}
function isInAppDirectory(filePath, routerRoot) {
    const normalizedFilePath = (0, common_1.toPosixPath)(filePath);
    const normalizedAppRoot = (0, common_1.toPosixPath)(routerRoot);
    return normalizedFilePath.startsWith(normalizedAppRoot + '/');
}
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
function markForConstantFolding(state) {
    assertExpoMetadata(state.file.metadata);
    state.file.metadata.performConstantFolding = true;
}
//# sourceMappingURL=server-metadata-plugin.js.map