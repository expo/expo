import { createContext, useContext, useState } from 'react';
export const RootModalContext = createContext({
    root: true,
    routes: [],
    addModal: () => { },
    removeModal: () => { },
});
export function RootModalProvider({ children }) {
    const parent = useContext(RootModalContext);
    const [state, setState] = useState(() => ({
        root: false,
        routes: [],
        addModal: (name) => {
            return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
        },
        removeModal: (name) => {
            return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
        },
    }));
    return <RootModalContext.Provider value={state}>{children}</RootModalContext.Provider>;
}
//# sourceMappingURL=RootModal.js.map