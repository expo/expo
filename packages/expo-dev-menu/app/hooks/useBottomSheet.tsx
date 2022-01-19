import * as React from 'react';

const BottomSheetContext = React.createContext<{ collapse: () => void }>(null);

type BottomSheetProviderProps = {
  children: React.ReactNode;
  collapse: () => void;
};

export function BottomSheetProvider({ children, collapse }: BottomSheetProviderProps) {
  return <BottomSheetContext.Provider value={{ collapse }}>{children}</BottomSheetContext.Provider>;
}

export const useBottomSheet = () => React.useContext(BottomSheetContext);
