"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomTransitionTargetContext = exports.ZoomTransitionSourceContext = void 0;
const react_1 = require("react");
exports.ZoomTransitionSourceContext = (0, react_1.createContext)(undefined);
exports.ZoomTransitionTargetContext = (0, react_1.createContext)({
    identifier: null,
    dismissalBoundsRect: null,
    setDismissalBoundsRect: () => { },
    addEnabler: () => { },
    removeEnabler: () => { },
    hasEnabler: false,
});
//# sourceMappingURL=zoom-transition-context.js.map