"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewParamsContext = void 0;
exports.useIsPreview = useIsPreview;
const react_1 = require("react");
exports.PreviewParamsContext = (0, react_1.createContext)(undefined);
function useIsPreview() {
    return !!(0, react_1.use)(exports.PreviewParamsContext);
}
//# sourceMappingURL=PreviewParamsContext.js.map