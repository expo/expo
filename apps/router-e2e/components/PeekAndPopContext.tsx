import { createContext, use } from 'react';

const PeekAndPopContext = createContext<{
  isGlobalTapped: boolean;
  setIsGlobalTapped: (isTapped: boolean) => void;
}>(undefined);

export const PeekAndPopContextProvider = PeekAndPopContext.Provider;

export const usePeekAndPopContext = () => {
  const context = use(PeekAndPopContext);
  if (context === undefined) {
    throw new Error('usePreviewContext must be used within a PreviewContextProvider');
  }
  return context;
};
