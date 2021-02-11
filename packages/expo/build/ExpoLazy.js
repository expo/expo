"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "registerRootComponent", {
  enumerable: true,
  get: function () {
    return _registerRootComponent.default;
  }
});
Object.defineProperty(exports, "Linking", {
  enumerable: true,
  get: function () {
    return _deprecated.Linking;
  }
});
Object.defineProperty(exports, "Notifications", {
  enumerable: true,
  get: function () {
    return _deprecated.Notifications;
  }
});
exports.Logs = void 0;

require("./Expo.fx");

var Logs = _interopRequireWildcard(require("./logs/Logs"));

exports.Logs = Logs;

var _registerRootComponent = _interopRequireDefault(require("./launch/registerRootComponent"));

var _deprecated = require("./deprecated");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

//# sourceMappingURL=ExpoLazy.js.map