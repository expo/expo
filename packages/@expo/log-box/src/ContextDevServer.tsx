import React, { useEffect, useState, createContext, useContext, ReactNode, useMemo  }  from 'react';
import { fetchProjectMetadataAsync } from './utils/devServerEndpoints';

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

const DevServerContext = createContext<DevServerContextType | undefined>(undefined);

export const DevServerProvider: React.FC<{ children: ReactNode; }> = ({
  children,
}) => {
  const meta = useProjectMetadataFromServer();

  return (
    <DevServerContext.Provider value={{
      projectRoot: meta?.projectRoot,
      serverRoot: meta?.serverRoot,
      sdkVersion: meta?.sdkVersion
    }}>
      {children}
    </DevServerContext.Provider>
  );
};

export const useDevServer = (): DevServerContextType => {
  const context = useContext(DevServerContext);
  if (context === undefined) {
    throw new Error('useDevServer must be used within a DevServerProvider');
  }
  return context;
};
