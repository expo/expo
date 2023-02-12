"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildResourceGroup = buildResourceGroup;
exports.buildResourceItem = buildResourceItem;
exports.ensureDefaultResourceXML = ensureDefaultResourceXML;
exports.findResourceGroup = findResourceGroup;
exports.getObjectAsResourceGroup = getObjectAsResourceGroup;
exports.getObjectAsResourceItems = getObjectAsResourceItems;
exports.getResourceItemsAsObject = getResourceItemsAsObject;
exports.readResourcesXMLAsync = readResourcesXMLAsync;
function _XML() {
  const data = require("../utils/XML");
  _XML = function () {
    return data;
  };
  return data;
}
const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources></resources>`;

/**
 * Read an XML file while providing a default fallback for resource files.
 *
 * @param options path to the XML file, returns a fallback XML if the path doesn't exist.
 */
async function readResourcesXMLAsync({
  path,
  fallback = fallbackResourceString
}) {
  const xml = await (0, _XML().readXMLAsync)({
    path,
    fallback
  });
  // Ensure the type is expected.
  if (!xml.resources) {
    xml.resources = {};
  }
  return xml;
}

/**
 * Ensure the provided xml has a `resources` object (the expected shape).
 *
 * @param xml
 */
function ensureDefaultResourceXML(xml) {
  if (!xml) {
    xml = {
      resources: {}
    };
  }
  if (!xml.resources) {
    xml.resources = {};
  }
  return xml;
}

/**
 * Build a `ResourceItemXML` given its `name` and `value`. This makes things a bit more readable.
 *
 * - JSON: `{ $: { name }, _: value }`
 * - XML: `<item name="NAME">VALUE</item>`
 *
 * @param props name and value strings.
 */
function buildResourceItem({
  name,
  value,
  targetApi,
  translatable
}) {
  const item = {
    $: {
      name
    },
    _: value
  };
  if (targetApi) {
    item.$['tools:targetApi'] = targetApi;
  }
  if (translatable !== undefined) {
    item.$['translatable'] = String(translatable);
  }
  return item;
}
function buildResourceGroup(parent) {
  var _parent$items;
  return {
    $: {
      name: parent.name,
      parent: parent.parent
    },
    item: (_parent$items = parent.items) !== null && _parent$items !== void 0 ? _parent$items : []
  };
}
function findResourceGroup(xml, group) {
  var _xml$filter, _xml$filter$call;
  const app = xml === null || xml === void 0 ? void 0 : (_xml$filter = xml.filter) === null || _xml$filter === void 0 ? void 0 : (_xml$filter$call = _xml$filter.call(xml, ({
    $: head
  }) => {
    let matches = head.name === group.name;
    if (group.parent != null && matches) {
      matches = head.parent === group.parent;
    }
    return matches;
  })) === null || _xml$filter$call === void 0 ? void 0 : _xml$filter$call[0];
  return app !== null && app !== void 0 ? app : null;
}

/**
 * Helper to convert a basic XML object into a simple k/v pair.
 *
 * @param xml
 * @returns
 */
function getResourceItemsAsObject(xml) {
  return xml.reduce((prev, curr) => ({
    ...prev,
    [curr.$.name]: curr._
  }), {});
}

/**
 * Helper to convert a basic k/v object to a ResourceItemXML array.
 *
 * @param xml
 * @returns
 */
function getObjectAsResourceItems(obj) {
  return Object.entries(obj).map(([name, value]) => ({
    $: {
      name
    },
    _: value
  }));
}
function getObjectAsResourceGroup(group) {
  return {
    $: {
      name: group.name,
      parent: group.parent
    },
    item: getObjectAsResourceItems(group.item)
  };
}
//# sourceMappingURL=Resources.js.map