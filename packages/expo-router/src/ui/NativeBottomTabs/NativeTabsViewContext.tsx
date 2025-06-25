import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type ViewProps } from 'react-native';

type BottomTabAccessoryContextType = {
  bottomTabAccessory: Record<string, ViewProps>;
  setBottomTabAccessory: (tabKey: string, node: ViewProps) => void;
  removeBottomTabAccessory: (tabKey: string) => void;
};

const BottomTabAccessoryContext = createContext<BottomTabAccessoryContextType | undefined>(
  undefined
);

export const BottomTabAccessoryProvider = ({ children }: { children: ReactNode }) => {
  const [bottomTabAccessory, setState] = useState<Record<string, ViewProps>>({});

  const setBottomTabAccessory = (tabKey: string, node: ViewProps) => {
    setState((prev) => ({ ...prev, [tabKey]: node }));
  };

  const removeBottomTabAccessory = (tabKey: string) => {
    setState((prev) => {
      const updated = { ...prev };
      delete updated[tabKey];
      return updated;
    });
  };

  return (
    <BottomTabAccessoryContext.Provider
      value={{ bottomTabAccessory, setBottomTabAccessory, removeBottomTabAccessory }}>
      {children}
    </BottomTabAccessoryContext.Provider>
  );
};

export const useBottomTabAccessory = () => {
  const context = useContext(BottomTabAccessoryContext);
  if (!context) {
    throw new Error('useBottomTabAccessory must be used within a BottomTabAccessoryProvider');
  }
  return context;
};
