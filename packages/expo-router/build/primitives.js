"use strict";
'use client';
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = exports.Screen = void 0;
const native_1 = require("@react-navigation/native");
// `@react-navigation/native` does not expose the Screen or Group components directly, so we have to
// do this hack.
_a = (0, native_1.createNavigatorFactory)({})(), exports.Screen = _a.Screen, exports.Group = _a.Group;
//# sourceMappingURL=primitives.js.map