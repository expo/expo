import React, { createContext, ReactNode, use } from 'react';

interface ActionsContextType {
  onMinimize: (() => void) | undefined;
  onReload: (() => void) | undefined;
  onCopyText: ((text: string) => void) | undefined;
}

const ActionsContextProvider = createContext<ActionsContextType>({
  onMinimize: undefined,
  onReload: undefined,
  onCopyText: undefined,
});

export const ActionsContext: React.FC<{ children: ReactNode } & ActionsContextType> = ({
  children,
  onMinimize,
  onReload,
  onCopyText,
}) => {
  return (
    <ActionsContextProvider value={{ onMinimize, onReload, onCopyText }}>
      {children}
    </ActionsContextProvider>
  );
};

export const withActions = (Component: React.FC, actions: ActionsContextType) => {
  return (props: any) => (
    <ActionsContext {...actions}>
      <Component {...props} />
    </ActionsContext>
  );
};

export const useActions = (): ActionsContextType => {
  const context = use(ActionsContextProvider);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
};
