"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.escapeAndroidString = escapeAndroidString;
exports.format = format;
exports.parseXMLAsync = parseXMLAsync;
exports.readXMLAsync = readXMLAsync;
exports.unescapeAndroidString = unescapeAndroidString;
exports.writeXMLAsync = writeXMLAsync;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _os() {
  const data = require("os");
  _os = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _xml2js() {
  const data = require("xml2js");
  _xml2js = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function writeXMLAsync(options) {
  const xml = format(options.xml);
  await _fs().default.promises.mkdir(_path().default.dirname(options.path), {
    recursive: true
  });
  await _fs().default.promises.writeFile(options.path, xml);
}
async function readXMLAsync(options) {
  var _manifest$resources;
  let contents = '';
  try {
    contents = await _fs().default.promises.readFile(options.path, {
      encoding: 'utf8',
      flag: 'r'
    });
  } catch {
    // catch and use fallback
  }
  const parser = new (_xml2js().Parser)();
  const manifest = await parser.parseStringPromise(contents || options.fallback || '');

  // For strings.xml
  if (Array.isArray(manifest === null || manifest === void 0 ? void 0 : (_manifest$resources = manifest.resources) === null || _manifest$resources === void 0 ? void 0 : _manifest$resources.string)) {
    for (const string of manifest === null || manifest === void 0 ? void 0 : (_manifest$resources2 = manifest.resources) === null || _manifest$resources2 === void 0 ? void 0 : _manifest$resources2.string) {
      var _manifest$resources2;
      if (string.$.translatable === 'false' || string.$.translatable === false) {
        continue;
      }
      string._ = unescapeAndroidString(string._);
    }
  }
  return manifest;
}
async function parseXMLAsync(contents) {
  const xml = await new (_xml2js().Parser)().parseStringPromise(contents);
  return xml;
}
const stringTimesN = (n, char) => Array(n + 1).join(char);
function format(manifest, {
  indentLevel = 2,
  newline = _os().EOL
} = {}) {
  let xmlInput;
  if (typeof manifest === 'string') {
    xmlInput = manifest;
  } else if (manifest.toString) {
    var _manifest$resources3;
    const builder = new (_xml2js().Builder)({
      headless: true
    });

    // For strings.xml
    if (Array.isArray(manifest === null || manifest === void 0 ? void 0 : (_manifest$resources3 = manifest.resources) === null || _manifest$resources3 === void 0 ? void 0 : _manifest$resources3.string)) {
      for (const string of manifest === null || manifest === void 0 ? void 0 : (_manifest$resources4 = manifest.resources) === null || _manifest$resources4 === void 0 ? void 0 : _manifest$resources4.string) {
        var _manifest$resources4;
        if (string.$.translatable === 'false' || string.$.translatable === false) {
          continue;
        }
        string._ = escapeAndroidString(string._);
      }
    }
    xmlInput = builder.buildObject(manifest);
    return xmlInput;
  } else {
    throw new Error(`Invalid XML value passed in: ${manifest}`);
  }
  const indentString = stringTimesN(indentLevel, ' ');
  let formatted = '';
  const regex = /(>)(<)(\/*)/g;
  const xml = xmlInput.replace(regex, `$1${newline}$2$3`);
  let pad = 0;
  xml.split(/\r?\n/).map(line => line.trim()).forEach(line => {
    let indent = 0;
    if (line.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (line.match(/^<\/\w/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else if (line.match(/^<\w([^>]*[^/])?>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }
    const padding = stringTimesN(pad, indentString);
    formatted += padding + line + newline;
    pad += indent;
  });
  return formatted.trim();
}

/**
 * Escapes Android string literals, specifically characters `"`, `'`, `\`, `\n`, `\r`, `\t`
 *
 * @param value unescaped Android XML string literal.
 */
function escapeAndroidString(value) {
  value = value.replace(/[\n\r\t'"@]/g, m => {
    switch (m) {
      case '"':
      case "'":
      case '@':
        return '\\' + m;
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\t':
        return '\\t';
      default:
        throw new Error(`Cannot escape unhandled XML character: ${m}`);
    }
  });
  if (value.match(/(^\s|\s$)/)) {
    value = '"' + value + '"';
  }
  return value;
}
function unescapeAndroidString(value) {
  return value.replace(/\\(.)/g, '$1');
}
//# sourceMappingURL=XML.js.map