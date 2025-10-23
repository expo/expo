import React, { useEffect, useState, createContext, use, ReactNode } from 'react';

import { fetchProjectMetadataAsync } from './utils/devServerEndpoints';

// Dev Server implementation https://github.com/expo/expo/blob/f29b9f3715e42dca87bf3eebf11f7e7dd1ff73c1/packages/%40expo/cli/src/start/server/metro/MetroBundlerDevServer.ts#L1145

function useProjectMetadataFromServer() {
  const [meta, setMeta] = useState<DevServerContextType | null>(null);
  useEffect(() => {
    fetchProjectMetadataAsync()
      .then(setMeta)
      .catch((error) => {
        console.warn(
          `Failed to fetch project metadata. Some debugging features may not work as expected: ${error}`
        );
      });
  }, []);

  return meta;
}

interface DevServerContextType {
  projectRoot: string | undefined;
  serverRoot: string | undefined;
  sdkVersion: string | undefined;
}

const DevServerContextProvider = createContext<DevServerContextType | undefined>(undefined);

export const DevServerContext: React.FC<{ children: ReactNode }> = ({ children }) => {
  const meta = useProjectMetadataFromServer();

  return (
    <DevServerContextProvider
      value={{
        projectRoot: meta?.projectRoot,
        serverRoot: meta?.serverRoot,
        sdkVersion: meta?.sdkVersion,
      }}>
      {children}
    </DevServerContextProvider>
  );
};

export const useDevServer = (): DevServerContextType => {
  const context = use(DevServerContextProvider);
  if (context === undefined) {
    throw new Error('useDevServer must be used within a DevServerProvider');
  }
  return context;
};
