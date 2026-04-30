"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useServerDocumentContext = useServerDocumentContext;
exports.ServerDocument = ServerDocument;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ServerDocumentContext = (0, react_1.createContext)(null);
function useServerDocumentContext() {
    return (0, react_1.useContext)(ServerDocumentContext) ?? {};
}
function ServerDocument({ children, data }) {
    return (0, jsx_runtime_1.jsx)(ServerDocumentContext.Provider, { value: data, children: children });
}
//# sourceMappingURL=ServerDocument.js.map