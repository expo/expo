import { createContext, useContext } from 'react';

export type AccountNameContextValue = {
  accountName?: string;
  setAccountName: (accountName?: string) => void;
};

export const AccountNameContext = createContext<AccountNameContextValue | null>(null);

export function useAccountName() {
  const context = useContext(AccountNameContext);

  if (context === null) {
    throw new Error('useAccountName must be used within a AccountNameProvider');
  }

  return context;
}
