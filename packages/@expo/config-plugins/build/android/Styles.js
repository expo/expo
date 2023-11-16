"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStylesGroupAsObject = exports.assignStylesValue = exports.getAppThemeLightNoActionBarGroup = exports.removeStylesItem = exports.setStylesItem = exports.getStylesItem = exports.getStyleParent = exports.getProjectStylesXMLPathAsync = exports.readStylesXMLAsync = void 0;
const Paths_1 = require("./Paths");
const Resources_1 = require("./Resources");
// Adds support for `tools:x`
const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources xmlns:tools="http://schemas.android.com/tools"></resources>`;
async function readStylesXMLAsync({ path, fallback = fallbackResourceString, }) {
    return (0, Resources_1.readResourcesXMLAsync)({ path, fallback });
}
exports.readStylesXMLAsync = readStylesXMLAsync;
async function getProjectStylesXMLPathAsync(projectRoot, { kind } = {}) {
    return (0, Paths_1.getResourceXMLPathAsync)(projectRoot, { kind, name: 'styles' });
}
exports.getProjectStylesXMLPathAsync = getProjectStylesXMLPathAsync;
function ensureDefaultStyleResourceXML(xml) {
    xml = (0, Resources_1.ensureDefaultResourceXML)(xml);
    if (!Array.isArray(xml?.resources?.style)) {
        xml.resources.style = [];
    }
    return xml;
}
function getStyleParent(xml, group) {
    return (0, Resources_1.findResourceGroup)(xml.resources.style, group);
}
exports.getStyleParent = getStyleParent;
function getStylesItem({ name, xml, parent, }) {
    xml = ensureDefaultStyleResourceXML(xml);
    const appTheme = getStyleParent(xml, parent);
    if (!appTheme) {
        return null;
    }
    if (appTheme.item) {
        const existingItem = appTheme.item.filter(({ $: head }) => head.name === name)[0];
        // Don't want to 2 of the same item, so if one exists, we overwrite it
        if (existingItem) {
            return existingItem;
        }
    }
    return null;
}
exports.getStylesItem = getStylesItem;
function setStylesItem({ item, xml, parent, }) {
    xml = ensureDefaultStyleResourceXML(xml);
    let appTheme = getStyleParent(xml, parent);
    if (!appTheme) {
        appTheme = (0, Resources_1.buildResourceGroup)(parent);
        xml.resources.style.push(appTheme);
    }
    if (appTheme.item) {
        const existingItem = appTheme.item.filter(({ $: head }) => head.name === item.$.name)[0];
        // Don't want to 2 of the same item, so if one exists, we overwrite it
        if (existingItem) {
            existingItem._ = item._;
            existingItem.$ = item.$;
        }
        else {
            appTheme.item.push(item);
        }
    }
    else {
        appTheme.item = [item];
    }
    return xml;
}
exports.setStylesItem = setStylesItem;
function removeStylesItem({ name, xml, parent, }) {
    xml = ensureDefaultStyleResourceXML(xml);
    const appTheme = getStyleParent(xml, parent);
    if (appTheme?.item) {
        const index = appTheme.item.findIndex(({ $: head }) => head.name === name);
        if (index > -1) {
            appTheme.item.splice(index, 1);
        }
    }
    return xml;
}
exports.removeStylesItem = removeStylesItem;
// This is a very common theme so make it reusable.
function getAppThemeLightNoActionBarGroup() {
    return { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' };
}
exports.getAppThemeLightNoActionBarGroup = getAppThemeLightNoActionBarGroup;
function assignStylesValue(xml, { add, value, targetApi, name, parent, }) {
    if (add) {
        return setStylesItem({
            xml,
            parent,
            item: (0, Resources_1.buildResourceItem)({
                name,
                targetApi,
                value,
            }),
        });
    }
    return removeStylesItem({
        xml,
        parent,
        name,
    });
}
exports.assignStylesValue = assignStylesValue;
/**
 * Helper to convert a styles.xml parent's children into a simple k/v pair.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
function getStylesGroupAsObject(xml, group) {
    const xmlGroup = getStyleParent(xml, group);
    return xmlGroup?.item ? (0, Resources_1.getResourceItemsAsObject)(xmlGroup.item) : null;
}
exports.getStylesGroupAsObject = getStylesGroupAsObject;
