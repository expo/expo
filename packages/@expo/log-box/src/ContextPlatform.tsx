import { createContext, useContext, ReactNode, useMemo } from 'react';

interface RuntimePlatformContextType {
  platform?: string;
  isNative: boolean;
}

const RuntimePlatformContext = createContext<RuntimePlatformContextType | undefined>(undefined);

export const RuntimePlatformProvider: React.FC<{ children: ReactNode; platform?: string }> = ({ children, platform }) => {
  const isNative = useMemo(() => {
    return platform === 'ios' || platform === 'android';
  }, [platform]);

  return (
    <RuntimePlatformContext.Provider value={{ platform, isNative }}>
      {children}
    </RuntimePlatformContext.Provider>
  );
};

export const withRuntimePlatform = (Component: React.FC, options: { platform: string }) => {
  return (props: any) => (
    <RuntimePlatformProvider platform={options.platform}>
      <Component {...props} />
    </RuntimePlatformProvider>
  );
};

export const useRuntimePlatform = (): RuntimePlatformContextType => {
  const context = useContext(RuntimePlatformContext);
  if (context === undefined) {
    throw new Error('useRuntimePlatform must be used within a RuntimePlatformProvider');
  }
  return context;
};