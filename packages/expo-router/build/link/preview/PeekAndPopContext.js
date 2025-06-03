"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePeekAndPopContext = exports.PeekAndPopContextProvider = void 0;
const react_1 = require("react");
const PeekAndPopContext = (0, react_1.createContext)(undefined);
exports.PeekAndPopContextProvider = PeekAndPopContext.Provider;
const usePeekAndPopContext = () => {
    const context = (0, react_1.use)(PeekAndPopContext);
    if (context === undefined) {
        throw new Error('usePreviewContext must be used within a PreviewContextProvider');
    }
    return context;
};
exports.usePeekAndPopContext = usePeekAndPopContext;
//# sourceMappingURL=PeekAndPopContext.js.map