import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, createContext, useContext, useEffect } from 'react';

type AccountNameContextValue = {
  accountName?: string;
  setAccountName: (accountName?: string) => void;
};

const AccountNameContext = createContext<AccountNameContextValue | null>(null);

export function useAccountName() {
  const context = useContext(AccountNameContext);

  if (context === null) {
    throw new Error('useAccountName must be used within a AccountNameProvider');
  }

  return context;
}

export function AccountNameProvider({ children }: { children: React.ReactNode }) {
  const [accountName, setAccountName] = useState<string | undefined>();

  useEffect(
    // when a user changes what account they are viewing as, we should save that preference so when they come back to the app, they see the same account
    function persistCurrentAccount() {
      if (accountName) {
        AsyncStorage.setItem('currentAccount', accountName);
      }
    },
    [accountName]
  );

  return (
    <AccountNameContext.Provider value={{ accountName, setAccountName }}>
      {children}
    </AccountNameContext.Provider>
  );
}
