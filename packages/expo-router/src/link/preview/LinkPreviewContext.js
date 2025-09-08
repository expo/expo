import { createContext, use, useState } from 'react';
const LinkPreviewContext = createContext(undefined);
export function LinkPreviewContextProvider({ children }) {
    const [openPreviewKey, setOpenPreviewKey] = useState(undefined);
    const isStackAnimationDisabled = openPreviewKey !== undefined;
    return (<LinkPreviewContext.Provider value={{ isStackAnimationDisabled, openPreviewKey, setOpenPreviewKey }}>
      {children}
    </LinkPreviewContext.Provider>);
}
export const useLinkPreviewContext = () => {
    const context = use(LinkPreviewContext);
    if (context == null) {
        throw new Error('useLinkPreviewContext must be used within a LinkPreviewContextProvider. This is likely a bug in Expo Router.');
    }
    return context;
};
//# sourceMappingURL=LinkPreviewContext.js.map