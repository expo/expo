import * as React from 'react';

import { setSessionAsync } from '../apiClient';
import { getUserProfileAsync, UserAccount, UserData } from '../functions/getUserProfileAsync';
import { restoreUserAsync } from '../functions/restoreUserAsync';
import { startAuthSessionAsync } from '../functions/startAuthSessionAsync';
import { useIsMounted } from '../hooks/useIsMounted';
import { resetBranchQueries } from '../queries/useBranchesForApp';

type UserContext = {
  userData?: UserData;
  isAuthenticated: boolean;
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
const Context = React.createContext<UserContext>(null);

type UserContextProviderProps = {
  children: React.ReactNode;
  initialUserData?: UserData;
};

export function UserContextProvider({ children, initialUserData }: UserContextProviderProps) {
  const [userData, setUserData] = React.useState<UserData | undefined>(initialUserData);
  const [selectedAccountId, setSelectedAccount] = React.useState<string>(
    initialUserData?.accounts[0]?.id ?? ''
  );
  const isMounted = useIsMounted();

  const selectedAccount = userData?.accounts.find((account) => account.id === selectedAccountId);

  async function login(type: 'signup' | 'login') {
    const sessionSecret = await startAuthSessionAsync(type).catch((cancelled) => {});

    if (sessionSecret) {
      await setSessionAsync(sessionSecret);
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
    const result = await clearSession();
    await resetBranchQueries();
    return result;
  }

  async function restore() {
    const userData = await restoreUserAsync();

    if (!userData) {
      clearSession();
    } else {
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

    return await setSessionAsync(null);
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
      <Context.Provider value={{ userData, selectedAccount, isAuthenticated: userData != null }}>
        {children}
      </Context.Provider>
    </ActionsContext.Provider>
  );
}

export const useUser = () => React.useContext<UserContext>(Context);
export const useUserActions = () => React.useContext(ActionsContext);
