import { TokenResponse, TokenResponseJson } from '@openid/appauth';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from './AsyncStorage';
import ServiceContext, { defaultService } from './ServiceContext';
import AuthContext from './AuthContext';

const storageKey = 'AppAuthServiceAuthProvider';
const shouldRehydrate = true;

const defaultState = { [defaultService]: null };

const getItemAsync = Platform.select<any>({
  default: AsyncStorage.getItem,
});
const setItemAsync = Platform.select<any>({
  default: AsyncStorage.setItem,
});
const deleteItemAsync = Platform.select<any>({
  default: AsyncStorage.removeItem,
});
// const getItemAsync = Platform.select<any>({
//   web: AsyncStorage.getItem,
//   default: SecureStore.getItemAsync,
// });
// const setItemAsync = Platform.select<any>({
//   web: AsyncStorage.setItem,
//   default: SecureStore.setItemAsync,
// });
// const deleteItemAsync = Platform.select<any>({
//   web: AsyncStorage.removeItem,
//   default: SecureStore.deleteItemAsync,
// });

type InternalServices = Record<string, TokenResponse | null>;

async function cache(value: InternalServices) {
  if (!AsyncStorage) return;
  if (value) {
    await setItemAsync(storageKey, JSON.stringify(value));
  } else {
    await deleteItemAsync(storageKey);
  }
}

async function rehydrate(): Promise<InternalServices | null> {
  if (!shouldRehydrate || !AsyncStorage) {
    return defaultState;
  }
  try {
    const item = await getItemAsync(storageKey);
    if (item) {
      const data = JSON.parse(item) as Record<string, TokenResponseJson | null>;
      let structured: InternalServices = {};
      for (const service of Object.keys(data)) {
        const item = data[service];
        if (item != null) {
          structured[service] = new TokenResponse(item);
        } else {
          structured[service] = null;
        }
      }
      return structured;
    }
    return null;
  } catch (ignored) {
    return defaultState;
  }
}

export default function AuthProvider({ children }: any) {
  const { service } = React.useContext(ServiceContext);
  const [internalAuth, setInternalAuth] = React.useState<InternalServices | null>(null);
  const [auth, setAuth] = React.useState<TokenResponse | null>(null);

  React.useEffect(() => {
    rehydrate().then(auth => {
      setInternalAuth(auth);
    });
  }, []);

  React.useEffect(() => {
    if (internalAuth) {
      if (service in internalAuth) {
        setAuth(internalAuth[service]);
      } else {
        setAuth(null);
      }
    }
  }, [internalAuth, service]);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth: auth => {
          setAuth(auth);
          cache({ ...internalAuth, [service]: auth?.toJson() ?? null } as InternalServices);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}
