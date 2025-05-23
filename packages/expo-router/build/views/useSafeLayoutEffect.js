"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSafeLayoutEffect = void 0;
const react_1 = require("react");
exports.useSafeLayoutEffect = typeof window !== 'undefined' ? react_1.useLayoutEffect : function () { };
//# sourceMappingURL=useSafeLayoutEffect.js.map