"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreventRemoveContext = usePreventRemoveContext;
const react_1 = require("react");
const PreventRemoveContext_1 = require("./PreventRemoveContext");
function usePreventRemoveContext() {
    const value = (0, react_1.use)(PreventRemoveContext_1.PreventRemoveContext);
    if (value == null) {
        throw new Error("Couldn't find the prevent remove context. Is your component inside NavigationContent?");
    }
    return value;
}
//# sourceMappingURL=usePreventRemoveContext.js.map