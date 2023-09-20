'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _AnimatedImplementation = _interopRequireDefault(require("./AnimatedImplementation"));
var _default = Object.assign({}, _AnimatedImplementation.default, {
  div: _AnimatedImplementation.default.createAnimatedComponent('div'),
  span: _AnimatedImplementation.default.createAnimatedComponent('span'),
  img: _AnimatedImplementation.default.createAnimatedComponent('img')
});
exports.default = _default;
//# sourceMappingURL=AnimatedWeb.js.map