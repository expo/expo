"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHeaderHeight = useHeaderHeight;
const react_1 = require("react");
const HeaderHeightContext_1 = require("./HeaderHeightContext");
function useHeaderHeight() {
    const height = (0, react_1.use)(HeaderHeightContext_1.HeaderHeightContext);
    if (height === undefined) {
        throw new Error("Couldn't find the header height. Are you inside a screen in a navigator with a header?");
    }
    return height;
}
//# sourceMappingURL=useHeaderHeight.js.map