"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assignStylesValue = assignStylesValue;
exports.getAppThemeGroup = getAppThemeGroup;
exports.getAppThemeLightNoActionBarGroup = getAppThemeLightNoActionBarGroup;
exports.getProjectStylesXMLPathAsync = getProjectStylesXMLPathAsync;
exports.getStyleParent = getStyleParent;
exports.getStylesGroupAsObject = getStylesGroupAsObject;
exports.getStylesItem = getStylesItem;
exports.readStylesXMLAsync = readStylesXMLAsync;
exports.removeStylesItem = removeStylesItem;
exports.setStylesItem = setStylesItem;
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
    return data;
  };
  return data;
}
function _Resources() {
  const data = require("./Resources");
  _Resources = function () {
    return data;
  };
  return data;
}
// Adds support for `tools:x`
const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources xmlns:tools="http://schemas.android.com/tools"></resources>`;
async function readStylesXMLAsync({
  path,
  fallback = fallbackResourceString
}) {
  return (0, _Resources().readResourcesXMLAsync)({
    path,
    fallback
  });
}
async function getProjectStylesXMLPathAsync(projectRoot, {
  kind
} = {}) {
  return (0, _Paths().getResourceXMLPathAsync)(projectRoot, {
    kind,
    name: 'styles'
  });
}
function ensureDefaultStyleResourceXML(xml) {
  xml = (0, _Resources().ensureDefaultResourceXML)(xml);
  if (!Array.isArray(xml?.resources?.style)) {
    xml.resources.style = [];
  }
  return xml;
}
function getStyleParent(xml, group) {
  return (0, _Resources().findResourceGroup)(xml.resources.style, group);
}
function getStylesItem({
  name,
  xml,
  parent
}) {
  xml = ensureDefaultStyleResourceXML(xml);
  const appTheme = getStyleParent(xml, parent);
  if (!appTheme) {
    return null;
  }
  if (appTheme.item) {
    const existingItem = appTheme.item.filter(({
      $: head
    }) => head.name === name)[0];

    // Don't want to 2 of the same item, so if one exists, we overwrite it
    if (existingItem) {
      return existingItem;
    }
  }
  return null;
}
function setStylesItem({
  item,
  xml,
  parent
}) {
  xml = ensureDefaultStyleResourceXML(xml);
  let appTheme = getStyleParent(xml, parent);
  if (!appTheme) {
    appTheme = (0, _Resources().buildResourceGroup)({
      parent: 'Theme.AppCompat.Light.NoActionBar',
      // Default AppTheme parent
      ...parent
    });
    xml.resources.style.push(appTheme);
  }
  if (appTheme.item) {
    const existingItem = appTheme.item.filter(({
      $: head
    }) => head.name === item.$.name)[0];

    // Don't want to 2 of the same item, so if one exists, we overwrite it
    if (existingItem) {
      existingItem._ = item._;
      existingItem.$ = item.$;
    } else {
      appTheme.item.push(item);
    }
  } else {
    appTheme.item = [item];
  }
  return xml;
}
function removeStylesItem({
  name,
  xml,
  parent
}) {
  xml = ensureDefaultStyleResourceXML(xml);
  const appTheme = getStyleParent(xml, parent);
  if (appTheme?.item) {
    const index = appTheme.item.findIndex(({
      $: head
    }) => head.name === name);
    if (index > -1) {
      appTheme.item.splice(index, 1);
    }
  }
  return xml;
}

/**
 * @deprecated Use `getAppThemeGroup` instead.
 * Matching on both style name and parent leads to prebuild issues, as `AppTheme`
 * style parent might be changed (when edge-to-edge is enabled, for example).
 */
function getAppThemeLightNoActionBarGroup() {
  return {
    name: 'AppTheme',
    parent: 'Theme.AppCompat.Light.NoActionBar'
  };
}

// This is a very common theme so make it reusable.
function getAppThemeGroup() {
  return {
    name: 'AppTheme'
  };
}
function assignStylesValue(xml, {
  add,
  value,
  targetApi,
  name,
  parent
}) {
  if (add) {
    return setStylesItem({
      xml,
      parent,
      item: (0, _Resources().buildResourceItem)({
        name,
        targetApi,
        value
      })
    });
  }
  return removeStylesItem({
    xml,
    parent,
    name
  });
}

/**
 * Helper to convert a styles.xml parent's children into a simple k/v pair.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
function getStylesGroupAsObject(xml, group) {
  const xmlGroup = getStyleParent(xml, group);
  return xmlGroup?.item ? (0, _Resources().getResourceItemsAsObject)(xmlGroup.item) : null;
}
//# sourceMappingURL=Styles.js.map