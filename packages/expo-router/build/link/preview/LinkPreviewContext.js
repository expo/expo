"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinkPreviewContext = void 0;
exports.LinkPreviewContextProvider = LinkPreviewContextProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const LinkPreviewContext = (0, react_1.createContext)(undefined);
function LinkPreviewContextProvider({ children }) {
    const [openPreviewKey, setOpenPreviewKey] = (0, react_1.useState)(undefined);
    const isStackAnimationDisabled = openPreviewKey !== undefined;
    return ((0, jsx_runtime_1.jsx)(LinkPreviewContext.Provider, { value: { isStackAnimationDisabled, openPreviewKey, setOpenPreviewKey }, children: children }));
}
const useLinkPreviewContext = () => {
    const context = (0, react_1.use)(LinkPreviewContext);
    if (context == null) {
        throw new Error('useLinkPreviewContext must be used within a LinkPreviewContextProvider. This is likely a bug in Expo Router.');
    }
    return context;
};
exports.useLinkPreviewContext = useLinkPreviewContext;
//# sourceMappingURL=LinkPreviewContext.js.map