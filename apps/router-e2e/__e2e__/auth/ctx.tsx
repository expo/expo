import { router } from 'expo-router';
import React from 'react';
import { useStorageState } from './useStorageState';

const AuthContext = React.createContext(null);

// This hook can be used to access the user info.
export function useSession() {
  const value = React.useContext(AuthContext);
  if (!value && process.env.NODE_ENV !== 'production') {
    throw new Error('`useSession` must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider(props) {
  const [[isLoading, session], setSession] = useStorageState('session');

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          setSession('xxx');
          router.replace('/');
        },
        signOut: () => {
          setSession(null);
        },
        user: session,
        isLoading,
      }}>
      {props.children}
    </AuthContext.Provider>
  );
}
