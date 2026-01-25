"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProductFile = addProductFile;
function addProductFile(xcodeProject, { targetName, groupName }) {
    const options = {
        basename: `${targetName}.appex`,
        group: groupName,
        explicitFileType: 'wrapper.app-extension',
        settings: {
            ATTRIBUTES: ['RemoveHeadersOnCopy'],
        },
        includeInIndex: 0,
        path: `${targetName}.appex`,
        sourceTree: 'BUILT_PRODUCTS_DIR',
    };
    return xcodeProject.addProductFile(targetName, options);
}
