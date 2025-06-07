"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinkPreviewContext = void 0;
exports.LinkPreviewContextProvider = LinkPreviewContextProvider;
const react_1 = require("react");
const LinkPreviewContext = (0, react_1.createContext)(undefined);
function LinkPreviewContextProvider({ children }) {
    const [isPreviewOpen, setIsPreviewOpen] = (0, react_1.useState)(false);
    const value = (0, react_1.useMemo)(() => ({ isPreviewOpen, setIsPreviewOpen }), [isPreviewOpen]);
    return <LinkPreviewContext.Provider value={value}>{children}</LinkPreviewContext.Provider>;
}
const useLinkPreviewContext = () => {
    const context = (0, react_1.use)(LinkPreviewContext);
    if (context === undefined) {
        throw new Error('Internal Expo router issue. useLinkPreviewContext must be used within a LinkPreviewContextProvider');
    }
    return context;
};
exports.useLinkPreviewContext = useLinkPreviewContext;
//# sourceMappingURL=LinkPreviewContext.js.map