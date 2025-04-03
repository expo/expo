"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootModalProvider = exports.RootModalContext = void 0;
const react_1 = require("react");
exports.RootModalContext = (0, react_1.createContext)({
    root: true,
    routes: [],
    addModal: () => { },
    removeModal: () => { },
});
function RootModalProvider({ children }) {
    const parent = (0, react_1.useContext)(exports.RootModalContext);
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
exports.RootModalProvider = RootModalProvider;
//# sourceMappingURL=RootModal.js.map