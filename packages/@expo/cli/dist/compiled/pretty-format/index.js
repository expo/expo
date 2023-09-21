'use strict';

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");
var _createClass2 = _interopRequireDefault2(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault2(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault2(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault2(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault2(require("@babel/runtime/helpers/getPrototypeOf"));
var _wrapNativeSuper2 = _interopRequireDefault2(require("@babel/runtime/helpers/wrapNativeSuper"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.DEFAULT_OPTIONS = void 0;
exports.format = format;
exports.plugins = void 0;
var _ansiStyles = _interopRequireDefault(require('ansi-styles'));
var _collections = require('./collections');
var _AsymmetricMatcher = _interopRequireDefault(require('./plugins/AsymmetricMatcher'));
var _DOMCollection = _interopRequireDefault(require('./plugins/DOMCollection'));
var _DOMElement = _interopRequireDefault(require('./plugins/DOMElement'));
var _Immutable = _interopRequireDefault(require('./plugins/Immutable'));
var _ReactElement = _interopRequireDefault(require('./plugins/ReactElement'));
var _ReactTestComponent = _interopRequireDefault(require('./plugins/ReactTestComponent'));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
var toString = Object.prototype.toString;
var toISOString = Date.prototype.toISOString;
var errorToString = Error.prototype.toString;
var regExpToString = RegExp.prototype.toString;
var getConstructorName = function getConstructorName(val) {
  return typeof val.constructor === 'function' && val.constructor.name || 'Object';
};
var isWindow = function isWindow(val) {
  return typeof window !== 'undefined' && val === window;
};
var SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
var NEWLINE_REGEXP = /\n/gi;
var PrettyFormatPluginError = function (_Error) {
  (0, _inherits2.default)(PrettyFormatPluginError, _Error);
  var _super = _createSuper(PrettyFormatPluginError);
  function PrettyFormatPluginError(message, stack) {
    var _this;
    (0, _classCallCheck2.default)(this, PrettyFormatPluginError);
    _this = _super.call(this, message);
    _this.stack = stack;
    _this.name = _this.constructor.name;
    return _this;
  }
  return (0, _createClass2.default)(PrettyFormatPluginError);
}((0, _wrapNativeSuper2.default)(Error));
function isToStringedArrayType(toStringed) {
  return toStringed === '[object Array]' || toStringed === '[object ArrayBuffer]' || toStringed === '[object DataView]' || toStringed === '[object Float32Array]' || toStringed === '[object Float64Array]' || toStringed === '[object Int8Array]' || toStringed === '[object Int16Array]' || toStringed === '[object Int32Array]' || toStringed === '[object Uint8Array]' || toStringed === '[object Uint8ClampedArray]' || toStringed === '[object Uint16Array]' || toStringed === '[object Uint32Array]';
}
function printNumber(val) {
  return Object.is(val, -0) ? '-0' : String(val);
}
function printBigInt(val) {
  return String(`${val}n`);
}
function printFunction(val, printFunctionName) {
  if (!printFunctionName) {
    return '[Function]';
  }
  return `[Function ${val.name || 'anonymous'}]`;
}
function printSymbol(val) {
  return String(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}
function printError(val) {
  return `[${errorToString.call(val)}]`;
}
function printBasicValue(val, printFunctionName, escapeRegex, escapeString) {
  if (val === true || val === false) {
    return `${val}`;
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (val === null) {
    return 'null';
  }
  var typeOf = typeof val;
  if (typeOf === 'number') {
    return printNumber(val);
  }
  if (typeOf === 'bigint') {
    return printBigInt(val);
  }
  if (typeOf === 'string') {
    if (escapeString) {
      return `"${val.replace(/"|\\/g, '\\$&')}"`;
    }
    return `"${val}"`;
  }
  if (typeOf === 'function') {
    return printFunction(val, printFunctionName);
  }
  if (typeOf === 'symbol') {
    return printSymbol(val);
  }
  var toStringed = toString.call(val);
  if (toStringed === '[object WeakMap]') {
    return 'WeakMap {}';
  }
  if (toStringed === '[object WeakSet]') {
    return 'WeakSet {}';
  }
  if (toStringed === '[object Function]' || toStringed === '[object GeneratorFunction]') {
    return printFunction(val, printFunctionName);
  }
  if (toStringed === '[object Symbol]') {
    return printSymbol(val);
  }
  if (toStringed === '[object Date]') {
    return isNaN(+val) ? 'Date { NaN }' : toISOString.call(val);
  }
  if (toStringed === '[object Error]') {
    return printError(val);
  }
  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    return regExpToString.call(val);
  }
  if (val instanceof Error) {
    return printError(val);
  }
  return null;
}
function printComplexValue(val, config, indentation, depth, refs, hasCalledToJSON) {
  if (refs.indexOf(val) !== -1) {
    return '[Circular]';
  }
  refs = refs.slice();
  refs.push(val);
  var hitMaxDepth = ++depth > config.maxDepth;
  var min = config.min;
  if (config.callToJSON && !hitMaxDepth && val.toJSON && typeof val.toJSON === 'function' && !hasCalledToJSON) {
    return printer(val.toJSON(), config, indentation, depth, refs, true);
  }
  var toStringed = toString.call(val);
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth ? '[Arguments]' : `${min ? '' : 'Arguments '}[${(0, _collections.printListItems)(val, config, indentation, depth, refs, printer)}]`;
  }
  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth ? `[${val.constructor.name}]` : `${min ? '' : !config.printBasicPrototype && val.constructor.name === 'Array' ? '' : `${val.constructor.name} `}[${(0, _collections.printListItems)(val, config, indentation, depth, refs, printer)}]`;
  }
  if (toStringed === '[object Map]') {
    return hitMaxDepth ? '[Map]' : `Map {${(0, _collections.printIteratorEntries)(val.entries(), config, indentation, depth, refs, printer, ' => ')}}`;
  }
  if (toStringed === '[object Set]') {
    return hitMaxDepth ? '[Set]' : `Set {${(0, _collections.printIteratorValues)(val.values(), config, indentation, depth, refs, printer)}}`;
  }
  return hitMaxDepth || isWindow(val) ? `[${getConstructorName(val)}]` : `${min ? '' : !config.printBasicPrototype && getConstructorName(val) === 'Object' ? '' : `${getConstructorName(val)} `}{${(0, _collections.printObjectProperties)(val, config, indentation, depth, refs, printer)}}`;
}
function isNewPlugin(plugin) {
  return plugin.serialize != null;
}
function printPlugin(plugin, val, config, indentation, depth, refs) {
  var printed;
  try {
    printed = isNewPlugin(plugin) ? plugin.serialize(val, config, indentation, depth, refs, printer) : plugin.print(val, function (valChild) {
      return printer(valChild, config, indentation, depth, refs);
    }, function (str) {
      var indentationNext = indentation + config.indent;
      return indentationNext + str.replace(NEWLINE_REGEXP, `\n${indentationNext}`);
    }, {
      edgeSpacing: config.spacingOuter,
      min: config.min,
      spacing: config.spacingInner
    }, config.colors);
  } catch (error) {
    throw new PrettyFormatPluginError(error.message, error.stack);
  }
  if (typeof printed !== 'string') {
    throw new Error(`pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`);
  }
  return printed;
}
function findPlugin(plugins, val) {
  for (var p = 0; p < plugins.length; p++) {
    try {
      if (plugins[p].test(val)) {
        return plugins[p];
      }
    } catch (error) {
      throw new PrettyFormatPluginError(error.message, error.stack);
    }
  }
  return null;
}
function printer(val, config, indentation, depth, refs, hasCalledToJSON) {
  var plugin = findPlugin(config.plugins, val);
  if (plugin !== null) {
    return printPlugin(plugin, val, config, indentation, depth, refs);
  }
  var basicResult = printBasicValue(val, config.printFunctionName, config.escapeRegex, config.escapeString);
  if (basicResult !== null) {
    return basicResult;
  }
  return printComplexValue(val, config, indentation, depth, refs, hasCalledToJSON);
}
var DEFAULT_THEME = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green'
};
var DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);
var toOptionsSubtype = function toOptionsSubtype(options) {
  return options;
};
var DEFAULT_OPTIONS = toOptionsSubtype({
  callToJSON: true,
  compareKeys: undefined,
  escapeRegex: false,
  escapeString: true,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  maxWidth: Infinity,
  min: false,
  plugins: [],
  printBasicPrototype: true,
  printFunctionName: true,
  theme: DEFAULT_THEME
});
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
function validateOptions(options) {
  Object.keys(options).forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_OPTIONS, key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });
  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error('pretty-format: Options "min" and "indent" cannot be used together.');
  }
  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error('pretty-format: Option "theme" must not be null.');
    }
    if (typeof options.theme !== 'object') {
      throw new Error(`pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`);
    }
  }
}
var getColorsHighlight = function getColorsHighlight(options) {
  return DEFAULT_THEME_KEYS.reduce(function (colors, key) {
    var value = options.theme && options.theme[key] !== undefined ? options.theme[key] : DEFAULT_THEME[key];
    var color = value && _ansiStyles.default[value];
    if (color && typeof color.close === 'string' && typeof color.open === 'string') {
      colors[key] = color;
    } else {
      throw new Error(`pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`);
    }
    return colors;
  }, Object.create(null));
};
var getColorsEmpty = function getColorsEmpty() {
  return DEFAULT_THEME_KEYS.reduce(function (colors, key) {
    colors[key] = {
      close: '',
      open: ''
    };
    return colors;
  }, Object.create(null));
};
var getPrintFunctionName = function getPrintFunctionName(options) {
  var _options$printFunctio;
  return (_options$printFunctio = options == null ? void 0 : options.printFunctionName) != null ? _options$printFunctio : DEFAULT_OPTIONS.printFunctionName;
};
var getEscapeRegex = function getEscapeRegex(options) {
  var _options$escapeRegex;
  return (_options$escapeRegex = options == null ? void 0 : options.escapeRegex) != null ? _options$escapeRegex : DEFAULT_OPTIONS.escapeRegex;
};
var getEscapeString = function getEscapeString(options) {
  var _options$escapeString;
  return (_options$escapeString = options == null ? void 0 : options.escapeString) != null ? _options$escapeString : DEFAULT_OPTIONS.escapeString;
};
var getConfig = function getConfig(options) {
  var _options$callToJSON, _options$indent, _options$maxDepth, _options$maxWidth, _options$min, _options$plugins, _options$printBasicPr;
  return {
    callToJSON: (_options$callToJSON = options == null ? void 0 : options.callToJSON) != null ? _options$callToJSON : DEFAULT_OPTIONS.callToJSON,
    colors: options != null && options.highlight ? getColorsHighlight(options) : getColorsEmpty(),
    compareKeys: typeof (options == null ? void 0 : options.compareKeys) === 'function' || (options == null ? void 0 : options.compareKeys) === null ? options.compareKeys : DEFAULT_OPTIONS.compareKeys,
    escapeRegex: getEscapeRegex(options),
    escapeString: getEscapeString(options),
    indent: options != null && options.min ? '' : createIndent((_options$indent = options == null ? void 0 : options.indent) != null ? _options$indent : DEFAULT_OPTIONS.indent),
    maxDepth: (_options$maxDepth = options == null ? void 0 : options.maxDepth) != null ? _options$maxDepth : DEFAULT_OPTIONS.maxDepth,
    maxWidth: (_options$maxWidth = options == null ? void 0 : options.maxWidth) != null ? _options$maxWidth : DEFAULT_OPTIONS.maxWidth,
    min: (_options$min = options == null ? void 0 : options.min) != null ? _options$min : DEFAULT_OPTIONS.min,
    plugins: (_options$plugins = options == null ? void 0 : options.plugins) != null ? _options$plugins : DEFAULT_OPTIONS.plugins,
    printBasicPrototype: (_options$printBasicPr = options == null ? void 0 : options.printBasicPrototype) != null ? _options$printBasicPr : true,
    printFunctionName: getPrintFunctionName(options),
    spacingInner: options != null && options.min ? ' ' : '\n',
    spacingOuter: options != null && options.min ? '' : '\n'
  };
};
function createIndent(indent) {
  return new Array(indent + 1).join(' ');
}
function format(val, options) {
  if (options) {
    validateOptions(options);
    if (options.plugins) {
      var plugin = findPlugin(options.plugins, val);
      if (plugin !== null) {
        return printPlugin(plugin, val, getConfig(options), '', 0, []);
      }
    }
  }
  var basicResult = printBasicValue(val, getPrintFunctionName(options), getEscapeRegex(options), getEscapeString(options));
  if (basicResult !== null) {
    return basicResult;
  }
  return printComplexValue(val, getConfig(options), '', 0, []);
}
var plugins = {
  AsymmetricMatcher: _AsymmetricMatcher.default,
  DOMCollection: _DOMCollection.default,
  DOMElement: _DOMElement.default,
  Immutable: _Immutable.default,
  ReactElement: _ReactElement.default,
  ReactTestComponent: _ReactTestComponent.default
};
exports.plugins = plugins;
var _default = format;
exports.default = _default;