"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inMemoryContext = inMemoryContext;
Object.defineProperty(exports, "requireContext", {
  enumerable: true,
  get: function () {
    return _requireContextPonyfill().default;
  }
});
exports.requireContextWithOverrides = requireContextWithOverrides;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _requireContextPonyfill() {
  const data = _interopRequireDefault(require("./require-context-ponyfill"));
  _requireContextPonyfill = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
function inMemoryContext(context) {
  return Object.assign(function (id) {
    id = id.replace(/^\.\//, '').replace(/\.\w*$/, '');
    return typeof context[id] === 'function' ? {
      default: context[id]
    } : context[id];
  }, {
    resolve: key => key,
    id: '0',
    keys: () => Object.keys(context).map(key => {
      const ext = _path().default.extname(key);
      key = key.replace(/^\.\//, '');
      return validExtensions.includes(ext) ? `./${key}` : `./${key}.js`;
    })
  });
}
function requireContextWithOverrides(dir, overrides) {
  const existingContext = (0, _requireContextPonyfill().default)(_path().default.resolve(process.cwd(), dir));
  return Object.assign(function (id) {
    if (id in overrides) {
      const route = overrides[id];
      return typeof route === 'function' ? {
        default: route
      } : route;
    } else {
      return existingContext(id);
    }
  }, {
    keys: () => [...Object.keys(overrides), ...existingContext.keys()],
    resolve: key => key,
    id: '0'
  });
}
//# sourceMappingURL=context-stubs.js.map