"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootModalContext = void 0;
exports.RootModalProvider = RootModalProvider;
const react_1 = require("react");
exports.RootModalContext = (0, react_1.createContext)({
    root: true,
    routes: [],
    addModal: () => { },
    removeModal: () => { },
});
function RootModalProvider({ children }) {
    const parent = (0, react_1.use)(exports.RootModalContext);
    const [state, setState] = (0, react_1.useState)(() => ({
        root: false,
        routes: [],
        addModal: (name) => {
            return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
        },
        removeModal: (name) => {
            return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
        },
    }));
    return <exports.RootModalContext.Provider value={state}>{children}</exports.RootModalContext.Provider>;
}
//# sourceMappingURL=RootModal.js.map