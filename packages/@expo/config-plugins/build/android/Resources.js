"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectAsResourceGroup = exports.getObjectAsResourceItems = exports.getResourceItemsAsObject = exports.findResourceGroup = exports.buildResourceGroup = exports.buildResourceItem = exports.ensureDefaultResourceXML = exports.readResourcesXMLAsync = void 0;
const XML_1 = require("../utils/XML");
const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources></resources>`;
/**
 * Read an XML file while providing a default fallback for resource files.
 *
 * @param options path to the XML file, returns a fallback XML if the path doesn't exist.
 */
async function readResourcesXMLAsync({ path, fallback = fallbackResourceString, }) {
    const xml = await (0, XML_1.readXMLAsync)({ path, fallback });
    // Ensure the type is expected.
    if (!xml.resources) {
        xml.resources = {};
    }
    return xml;
}
exports.readResourcesXMLAsync = readResourcesXMLAsync;
/**
 * Ensure the provided xml has a `resources` object (the expected shape).
 *
 * @param xml
 */
function ensureDefaultResourceXML(xml) {
    if (!xml) {
        xml = { resources: {} };
    }
    if (!xml.resources) {
        xml.resources = {};
    }
    return xml;
}
exports.ensureDefaultResourceXML = ensureDefaultResourceXML;
/**
 * Build a `ResourceItemXML` given its `name` and `value`. This makes things a bit more readable.
 *
 * - JSON: `{ $: { name }, _: value }`
 * - XML: `<item name="NAME">VALUE</item>`
 *
 * @param props name and value strings.
 */
function buildResourceItem({ name, value, targetApi, translatable, }) {
    const item = { $: { name }, _: value };
    if (targetApi) {
        item.$['tools:targetApi'] = targetApi;
    }
    if (translatable !== undefined) {
        item.$['translatable'] = String(translatable);
    }
    return item;
}
exports.buildResourceItem = buildResourceItem;
function buildResourceGroup(parent) {
    return {
        $: { name: parent.name, parent: parent.parent },
        item: parent.items ?? [],
    };
}
exports.buildResourceGroup = buildResourceGroup;
function findResourceGroup(xml, group) {
    const app = xml?.filter?.(({ $: head }) => {
        let matches = head.name === group.name;
        if (group.parent != null && matches) {
            matches = head.parent === group.parent;
        }
        return matches;
    })?.[0];
    return app ?? null;
}
exports.findResourceGroup = findResourceGroup;
/**
 * Helper to convert a basic XML object into a simple k/v pair.
 *
 * @param xml
 * @returns
 */
function getResourceItemsAsObject(xml) {
    return xml.reduce((prev, curr) => ({
        ...prev,
        [curr.$.name]: curr._,
    }), {});
}
exports.getResourceItemsAsObject = getResourceItemsAsObject;
/**
 * Helper to convert a basic k/v object to a ResourceItemXML array.
 *
 * @param xml
 * @returns
 */
function getObjectAsResourceItems(obj) {
    return Object.entries(obj).map(([name, value]) => ({
        $: { name },
        _: value,
    }));
}
exports.getObjectAsResourceItems = getObjectAsResourceItems;
function getObjectAsResourceGroup(group) {
    return {
        $: {
            name: group.name,
            parent: group.parent,
        },
        item: getObjectAsResourceItems(group.item),
    };
}
exports.getObjectAsResourceGroup = getObjectAsResourceGroup;
