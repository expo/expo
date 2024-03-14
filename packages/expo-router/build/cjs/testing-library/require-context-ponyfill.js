"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requireContext;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// @ts-ignore: types node

// @ts-ignore: types node

function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/) {
  const files = {};
  function readDirectory(directory) {
    _nodeFs().default.readdirSync(directory).forEach(file => {
      const fullPath = _nodePath().default.resolve(directory, file);
      const relativePath = `./${_nodePath().default.relative(base, fullPath).split(_nodePath().default.sep).join('/')}`;
      if (_nodeFs().default.statSync(fullPath).isDirectory()) {
        if (scanSubDirectories) readDirectory(fullPath);
        return;
      }
      if (!regularExpression.test(relativePath)) return;
      files[relativePath] = true;
    });
  }
  readDirectory(base);
  const context = Object.assign(function Module(file) {
    return require(_nodePath().default.join(base, file));
  }, {
    keys: () => Object.keys(files),
    resolve: key => key,
    id: '0',
    __add(file) {
      files[file] = true;
    },
    __delete(file) {
      delete files[file];
    }
  });
  return context;
}
//# sourceMappingURL=require-context-ponyfill.js.map