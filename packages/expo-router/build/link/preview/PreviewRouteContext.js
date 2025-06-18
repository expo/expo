"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewRouteContext = void 0;
exports.usePreviewInfo = usePreviewInfo;
const react_1 = require("react");
exports.PreviewRouteContext = (0, react_1.createContext)(undefined);
function usePreviewInfo() {
    const paramsContext = (0, react_1.use)(exports.PreviewRouteContext);
    return {
        isPreview: !!paramsContext,
        ...paramsContext,
    };
}
//# sourceMappingURL=PreviewRouteContext.js.map