"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStringItem = exports.setStringItem = exports.getProjectStringsXMLPathAsync = void 0;
const Paths_1 = require("./Paths");
async function getProjectStringsXMLPathAsync(projectRoot, { kind } = {}) {
    return (0, Paths_1.getResourceXMLPathAsync)(projectRoot, { kind, name: 'strings' });
}
exports.getProjectStringsXMLPathAsync = getProjectStringsXMLPathAsync;
function setStringItem(itemToAdd, stringFileContentsJSON) {
    if (!stringFileContentsJSON?.resources?.string) {
        if (!stringFileContentsJSON.resources || typeof stringFileContentsJSON.resources === 'string') {
            // file was empty and JSON is `{resources : ''}`
            stringFileContentsJSON.resources = {};
        }
        stringFileContentsJSON.resources.string = itemToAdd;
        return stringFileContentsJSON;
    }
    for (const newItem of itemToAdd) {
        const stringNameExists = stringFileContentsJSON.resources.string.findIndex((e) => e.$.name === newItem.$.name);
        if (stringNameExists > -1) {
            // replace the previous item
            stringFileContentsJSON.resources.string[stringNameExists] = newItem;
        }
        else {
            stringFileContentsJSON.resources.string =
                stringFileContentsJSON.resources.string.concat(newItem);
        }
    }
    return stringFileContentsJSON;
}
exports.setStringItem = setStringItem;
function removeStringItem(named, stringFileContentsJSON) {
    if (stringFileContentsJSON?.resources?.string) {
        const stringNameExists = stringFileContentsJSON.resources.string.findIndex((e) => e.$.name === named);
        if (stringNameExists > -1) {
            // replace the previous value
            stringFileContentsJSON.resources.string.splice(stringNameExists, 1);
        }
    }
    return stringFileContentsJSON;
}
exports.removeStringItem = removeStringItem;
