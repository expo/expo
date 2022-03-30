import React, { useState, createContext, useContext } from 'react';

import { HomeScreenDataQuery, Home_CurrentUserQuery } from '../graphql/types';

type ContextValue = {
  homeScreenData?: HomeScreenDataQuery;
  setHomeScreenData: (d?: HomeScreenDataQuery) => void;
  currentUserData?: Home_CurrentUserQuery;
  setCurrentUserData: (d?: Home_CurrentUserQuery) => void;
};

const InitialDataContext = createContext<ContextValue | null>(null);

export function useInitialData() {
  const context = useContext(InitialDataContext);

  if (context === null) {
    throw new Error('useInitialData must be used within a InitialDataProvider');
  }

  return context;
}

export function InitialDataProvider({ children }: { children: React.ReactNode }) {
  const [homeScreenData, setHomeScreenData] = useState<HomeScreenDataQuery | undefined>();
  const [currentUserData, setCurrentUserData] = useState<Home_CurrentUserQuery | undefined>();

  return (
    <InitialDataContext.Provider
      value={{ homeScreenData, setHomeScreenData, currentUserData, setCurrentUserData }}>
      {children}
    </InitialDataContext.Provider>
  );
}
