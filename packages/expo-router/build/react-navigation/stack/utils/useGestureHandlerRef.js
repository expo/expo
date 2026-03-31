"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGestureHandlerRef = useGestureHandlerRef;
const react_1 = require("react");
const GestureHandlerRefContext_1 = require("./GestureHandlerRefContext");
function useGestureHandlerRef() {
    const ref = (0, react_1.use)(GestureHandlerRefContext_1.GestureHandlerRefContext);
    if (ref === undefined) {
        throw new Error("Couldn't find a ref for gesture handler. Are you inside a screen in Stack?");
    }
    return ref;
}
//# sourceMappingURL=useGestureHandlerRef.js.map