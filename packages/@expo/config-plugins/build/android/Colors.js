"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assignColorValue = assignColorValue;
exports.getColorsAsObject = getColorsAsObject;
exports.getObjectAsColorsXml = getObjectAsColorsXml;
exports.getProjectColorsXMLPathAsync = getProjectColorsXMLPathAsync;
exports.removeColorItem = removeColorItem;
exports.setColorItem = setColorItem;

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

function getProjectColorsXMLPathAsync(projectRoot, {
  kind
} = {}) {
  return (0, _Paths().getResourceXMLPathAsync)(projectRoot, {
    kind,
    name: 'colors'
  });
}

function setColorItem(itemToAdd, colorFileContentsJSON) {
  var _colorFileContentsJSO;

  if ((_colorFileContentsJSO = colorFileContentsJSON.resources) !== null && _colorFileContentsJSO !== void 0 && _colorFileContentsJSO.color) {
    const colorNameExists = colorFileContentsJSON.resources.color.filter(e => e.$.name === itemToAdd.$.name)[0];

    if (colorNameExists) {
      colorNameExists._ = itemToAdd._;
    } else {
      colorFileContentsJSON.resources.color.push(itemToAdd);
    }
  } else {
    if (!colorFileContentsJSON.resources || typeof colorFileContentsJSON.resources === 'string') {
      //file was empty and JSON is `{resources : ''}`
      colorFileContentsJSON.resources = {};
    }

    colorFileContentsJSON.resources.color = [itemToAdd];
  }

  return colorFileContentsJSON;
}

function removeColorItem(named, contents) {
  var _contents$resources;

  if ((_contents$resources = contents.resources) !== null && _contents$resources !== void 0 && _contents$resources.color) {
    const index = contents.resources.color.findIndex(e => e.$.name === named);

    if (index > -1) {
      // replace the previous value
      contents.resources.color.splice(index, 1);
    }
  }

  return contents;
}
/**
 * Set or remove value in XML based on nullish factor of the `value` property.
 */


function assignColorValue(xml, {
  value,
  name
}) {
  if (value) {
    return setColorItem((0, _Resources().buildResourceItem)({
      name,
      value
    }), xml);
  }

  return removeColorItem(name, xml);
}
/**
 * Helper to convert a basic XML object into a simple k/v pair.
 * `colors.xml` is a very basic XML file so this is pretty safe to do.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */


function getColorsAsObject(xml) {
  var _xml$resources;

  if (!(xml !== null && xml !== void 0 && (_xml$resources = xml.resources) !== null && _xml$resources !== void 0 && _xml$resources.color)) {
    return null;
  }

  return (0, _Resources().getResourceItemsAsObject)(xml.resources.color);
}
/**
 * Helper to convert a basic k/v object to a colors XML object.
 *
 * @param xml
 * @returns
 */


function getObjectAsColorsXml(obj) {
  return {
    resources: {
      color: (0, _Resources().getObjectAsResourceItems)(obj)
    }
  };
}
//# sourceMappingURL=Colors.js.map