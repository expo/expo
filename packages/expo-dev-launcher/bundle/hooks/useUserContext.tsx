import React from 'react';

import {
  isDevMenuAvailable,
  isLoggedInAsync,
  addUserLoginListener,
  addUserLogoutListener,
} from './../DevMenu';

const UserContext = React.createContext({
  isUserLoggedIn: false,
});

export function UserContextProvider(props: React.PropsWithChildren<any>) {
  const [isUserLoggedIn, setIsUserLoggedIn] = React.useState(false);

  React.useEffect(() => {
    let onLogin;
    let onLogout;

    if (isDevMenuAvailable) {
      onLogin = addUserLoginListener(() => setIsUserLoggedIn(true));
      onLogout = addUserLogoutListener(() => setIsUserLoggedIn(false));
      isLoggedInAsync().then((isUserLogin) => {
        setIsUserLoggedIn(isUserLogin);
      });
    }

    return () => {
      onLogin?.remove();
      onLogout?.remove();
    };
  });

  return <UserContext.Provider value={{ isUserLoggedIn }}>{props.children}</UserContext.Provider>;
}

export const useUserContext = () => React.useContext(UserContext);
