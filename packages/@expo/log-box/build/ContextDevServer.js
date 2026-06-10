import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState, createContext, use } from 'react';
import { fetchProjectMetadataAsync } from './utils/devServerEndpoints';
// Dev Server implementation https://github.com/expo/expo/blob/f29b9f3715e42dca87bf3eebf11f7e7dd1ff73c1/packages/%40expo/cli/src/start/server/metro/MetroBundlerDevServer.ts#L1145
function useProjectMetadataFromServer() {
    const [meta, setMeta] = useState(null);
    useEffect(() => {
        fetchProjectMetadataAsync()
            .then(setMeta)
            .catch((error) => {
            console.warn(`Failed to fetch project metadata. Some debugging features may not work as expected: ${error}`);
        });
    }, []);
    return meta;
}
const DevServerContextProvider = createContext(undefined);
export const DevServerContext = ({ children }) => {
    const meta = useProjectMetadataFromServer();
    return (_jsx(DevServerContextProvider, { value: {
            projectRoot: meta?.projectRoot,
            serverRoot: meta?.serverRoot,
            sdkVersion: meta?.sdkVersion,
        }, children: children }));
};
export const useDevServer = () => {
    const context = use(DevServerContextProvider);
    if (context === undefined) {
        throw new Error('useDevServer must be used within a DevServerProvider');
    }
    return context;
};
//# sourceMappingURL=ContextDevServer.js.map