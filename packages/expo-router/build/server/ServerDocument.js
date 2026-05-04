"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useServerDocumentContext = useServerDocumentContext;
exports.ServerDocument = ServerDocument;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ServerDocumentContext = (0, react_1.createContext)(null);
/**
 * Returns the server document data for server-side rendering, including `<html>`/`<body>`
 * attributes and additional nodes to add to `<head>`/`<body>` for metadata and assets.
 *
 * @example
 * ```tsx
 * import { useServerDocumentContext } from 'expo-router/html';
 *
 * export default function Root({ children }) {
 *   const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
 *   return (
 *     <html {...htmlAttributes}>
 *       <head>{headNodes}</head>
 *       <body {...bodyAttributes}>
 *         {children}
 *         {bodyNodes}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
function useServerDocumentContext() {
    return (0, react_1.useContext)(ServerDocumentContext) ?? {};
}
function ServerDocument({ children, data }) {
    return (0, jsx_runtime_1.jsx)(ServerDocumentContext.Provider, { value: data, children: children });
}
//# sourceMappingURL=ServerDocument.js.map