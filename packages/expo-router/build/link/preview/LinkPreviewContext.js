"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinkPreviewContext = void 0;
exports.LinkPreviewContextProvider = LinkPreviewContextProvider;
const react_1 = require("react");
const LinkPreviewContext = (0, react_1.createContext)(undefined);
function LinkPreviewContextProvider({ children }) {
    const [isPreviewOpen, setIsPreviewOpen] = (0, react_1.useState)(false);
    return (<LinkPreviewContext.Provider value={{ isPreviewOpen, setIsPreviewOpen }}>
      {children}
    </LinkPreviewContext.Provider>);
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