"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectAsColorsXml = exports.getColorsAsObject = exports.assignColorValue = exports.removeColorItem = exports.setColorItem = exports.getProjectColorsXMLPathAsync = void 0;
const Paths_1 = require("./Paths");
const Resources_1 = require("./Resources");
function getProjectColorsXMLPathAsync(projectRoot, { kind } = {}) {
    return (0, Paths_1.getResourceXMLPathAsync)(projectRoot, { kind, name: 'colors' });
}
exports.getProjectColorsXMLPathAsync = getProjectColorsXMLPathAsync;
function setColorItem(itemToAdd, colorFileContentsJSON) {
    if (colorFileContentsJSON.resources?.color) {
        const colorNameExists = colorFileContentsJSON.resources.color.filter((e) => e.$.name === itemToAdd.$.name)[0];
        if (colorNameExists) {
            colorNameExists._ = itemToAdd._;
        }
        else {
            colorFileContentsJSON.resources.color.push(itemToAdd);
        }
    }
    else {
        if (!colorFileContentsJSON.resources || typeof colorFileContentsJSON.resources === 'string') {
            //file was empty and JSON is `{resources : ''}`
            colorFileContentsJSON.resources = {};
        }
        colorFileContentsJSON.resources.color = [itemToAdd];
    }
    return colorFileContentsJSON;
}
exports.setColorItem = setColorItem;
function removeColorItem(named, contents) {
    if (contents.resources?.color) {
        const index = contents.resources.color.findIndex((e) => e.$.name === named);
        if (index > -1) {
            // replace the previous value
            contents.resources.color.splice(index, 1);
        }
    }
    return contents;
}
exports.removeColorItem = removeColorItem;
/**
 * Set or remove value in XML based on nullish factor of the `value` property.
 */
function assignColorValue(xml, { value, name, }) {
    if (value) {
        return setColorItem((0, Resources_1.buildResourceItem)({
            name,
            value,
        }), xml);
    }
    return removeColorItem(name, xml);
}
exports.assignColorValue = assignColorValue;
/**
 * Helper to convert a basic XML object into a simple k/v pair.
 * `colors.xml` is a very basic XML file so this is pretty safe to do.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
function getColorsAsObject(xml) {
    if (!xml?.resources?.color) {
        return null;
    }
    return (0, Resources_1.getResourceItemsAsObject)(xml.resources.color);
}
exports.getColorsAsObject = getColorsAsObject;
/**
 * Helper to convert a basic k/v object to a colors XML object.
 *
 * @param xml
 * @returns
 */
function getObjectAsColorsXml(obj) {
    return {
        resources: {
            color: (0, Resources_1.getObjectAsResourceItems)(obj),
        },
    };
}
exports.getObjectAsColorsXml = getObjectAsColorsXml;
