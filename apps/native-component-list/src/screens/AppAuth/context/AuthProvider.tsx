import { TokenResponse, TokenResponseJson } from '@openid/appauth';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';
const AsyncStorage = {} as any;
import AuthContext from './AuthContext';

const storageKey = 'AppAuthAuthProvider';
const shouldRehydrate = true;

const defaultState = null;

const getItemAsync = Platform.select<any>({
  web: AsyncStorage.getItem,
  default: SecureStore.getItemAsync,
});
const setItemAsync = Platform.select<any>({
  web: AsyncStorage.setItem,
  default: SecureStore.setItemAsync,
});
const deleteItemAsync = Platform.select<any>({
  web: AsyncStorage.removeItem,
  default: SecureStore.deleteItemAsync,
});

async function cache(value: TokenResponse | null) {
  if (value) {
    await setItemAsync(storageKey, JSON.stringify(value.toJson()));
  } else {
    await deleteItemAsync(storageKey);
  }
}

async function rehydrate(): Promise<TokenResponse | null> {
  if (!shouldRehydrate || !AsyncStorage) {
    return defaultState;
  }
  try {
    const item = await getItemAsync(storageKey);
    if (item) {
      const data = JSON.parse(item) as TokenResponseJson;
      return new TokenResponse(data);
    }
    return null;
  } catch (ignored) {
    return defaultState;
  }
}

export default function AuthProvider({ children }: any) {
  const [auth, setAuth] = React.useState<TokenResponse | null>(null);

  React.useEffect(() => {
    rehydrate().then(auth => setAuth(auth));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth: auth => {
          setAuth(auth);
          cache(auth);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}
