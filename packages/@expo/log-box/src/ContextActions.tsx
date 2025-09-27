import { createContext, useContext, ReactNode } from 'react';

interface ActionsContextType {
  onMinimize: (() => void) | undefined;
}

const ActionsContext = createContext<ActionsContextType>({
  onMinimize: () => {},
});

export const ActionsProvider: React.FC<{ children: ReactNode; } & ActionsContextType> = ({ children, onMinimize }) => {
  return (
    <ActionsContext.Provider value={{ onMinimize }}>
      {children}
    </ActionsContext.Provider>
  );
};

export const withActions = (Component: React.FC, actions: ActionsContextType) => {
  return (props: any) => (
    <ActionsProvider {...actions}>
      <Component {...props} />
    </ActionsProvider>
  );
};

export const useActions = (): ActionsContextType => {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
};