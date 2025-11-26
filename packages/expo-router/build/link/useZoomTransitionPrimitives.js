"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZoomTransitionPrimitives = useZoomTransitionPrimitives;
const react_1 = require("react");
function useZoomTransitionPrimitives({ href }) {
    const ZoomTransitionWrapper = (0, react_1.useMemo)(() => {
        return (props) => props.children;
    }, []);
    return { ZoomTransitionWrapper, href };
}
//# sourceMappingURL=useZoomTransitionPrimitives.js.map