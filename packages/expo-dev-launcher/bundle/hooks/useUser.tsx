import * as React from 'react';

import { apiClient } from '../apiClient';
import { getUserProfileAsync, UserAccount, UserData } from '../functions/getUserProfileAsync';
import { startAuthSessionAsync } from '../functions/startAuthSessionAsync';
import * as DevMenu from '../native-modules/DevMenuInternal';
import { useIsMounted } from './useIsMounted';

type UserContext = {
  userData?: UserData;
  selectedAccount?: UserAccount;
};

type UserActionsContext = {
  login: (loginType: 'signup' | 'login') => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  setUserData: (userData: UserData) => void;
  setSelectedAccount: (accountId: string) => void;
};

const ActionsContext = React.createContext<UserActionsContext | null>(null);
const Context = React.createContext<UserContext | null>(null);

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = React.useState<UserData | undefined>(undefined);
  const [selectedAccountId, setSelectedAccount] = React.useState<string>('');
  const isMounted = useIsMounted();

  const selectedAccount = userData?.accounts.find((account) => account.id === selectedAccountId);

  React.useEffect(() => {
    restore();
  }, []);

  async function login(type: 'signup' | 'login') {
    const sessionSecret = await startAuthSessionAsync(type).catch((cancelled) => {});

    if (sessionSecret) {
      await DevMenu.setSessionAsync({ sessionSecret });
      apiClient.setHeader('expo-session', sessionSecret);
      const userData = await getUserProfileAsync();

      if (isMounted()) {
        setUserData(userData);
        setSelectedAccount(userData.accounts[0].id);
      }
    } else {
      await clearSession();
    }
  }

  async function logout() {
    return clearSession();
  }

  async function restore() {
    const session = await DevMenu.restoreSessionAsync().catch((cancelled) => {
      clearSession();
    });

    if (session) {
      apiClient.setHeader('expo-session', session.sessionSecret);
      const userData = await getUserProfileAsync();

      if (isMounted()) {
        setUserData(userData);
        setSelectedAccount(userData.accounts[0].id);
      }
    }
  }

  async function clearSession() {
    if (isMounted()) {
      setUserData(undefined);
      setSelectedAccount(undefined);
    }
    apiClient.setHeader('expo-session', '');
    await DevMenu.setSessionAsync(null);
  }

  const actions = React.useMemo(() => {
    return {
      login,
      logout,
      restore,
      setUserData,
      setSelectedAccount,
    };
  }, []);

  return (
    <ActionsContext.Provider value={actions}>
      <Context.Provider value={{ userData, selectedAccount }}>{children}</Context.Provider>
    </ActionsContext.Provider>
  );
}

export const useUser = () => React.useContext(Context);
export const useUserActions = () => React.useContext(ActionsContext);
