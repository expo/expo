"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = exports.Screen = void 0;
const core_1 = require("@react-navigation/core");
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
_a = (0, core_1.createNavigatorFactory)({})(), exports.Screen = _a.Screen, exports.Group = _a.Group;
//# sourceMappingURL=primitives.js.map