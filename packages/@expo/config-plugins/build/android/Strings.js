"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getProjectStringsXMLPathAsync = getProjectStringsXMLPathAsync;
exports.removeStringItem = removeStringItem;
exports.setStringItem = setStringItem;
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
    return data;
  };
  return data;
}
async function getProjectStringsXMLPathAsync(projectRoot, {
  kind
} = {}) {
  return (0, _Paths().getResourceXMLPathAsync)(projectRoot, {
    kind,
    name: 'strings'
  });
}
function setStringItem(itemToAdd, stringFileContentsJSON) {
  var _stringFileContentsJS;
  if (!(stringFileContentsJSON !== null && stringFileContentsJSON !== void 0 && (_stringFileContentsJS = stringFileContentsJSON.resources) !== null && _stringFileContentsJS !== void 0 && _stringFileContentsJS.string)) {
    if (!stringFileContentsJSON.resources || typeof stringFileContentsJSON.resources === 'string') {
      // file was empty and JSON is `{resources : ''}`
      stringFileContentsJSON.resources = {};
    }
    stringFileContentsJSON.resources.string = itemToAdd;
    return stringFileContentsJSON;
  }
  for (const newItem of itemToAdd) {
    const stringNameExists = stringFileContentsJSON.resources.string.findIndex(e => e.$.name === newItem.$.name);
    if (stringNameExists > -1) {
      // replace the previous item
      stringFileContentsJSON.resources.string[stringNameExists] = newItem;
    } else {
      stringFileContentsJSON.resources.string = stringFileContentsJSON.resources.string.concat(newItem);
    }
  }
  return stringFileContentsJSON;
}
function removeStringItem(named, stringFileContentsJSON) {
  var _stringFileContentsJS2;
  if (stringFileContentsJSON !== null && stringFileContentsJSON !== void 0 && (_stringFileContentsJS2 = stringFileContentsJSON.resources) !== null && _stringFileContentsJS2 !== void 0 && _stringFileContentsJS2.string) {
    const stringNameExists = stringFileContentsJSON.resources.string.findIndex(e => e.$.name === named);
    if (stringNameExists > -1) {
      // replace the previous value
      stringFileContentsJSON.resources.string.splice(stringNameExists, 1);
    }
  }
  return stringFileContentsJSON;
}
//# sourceMappingURL=Strings.js.map