import * as React from 'react';

type PendingDeepLinkContext = {
  pendingDeepLink: string;
  setPendingDeepLink: (url: string) => void;
};

const Context = React.createContext<PendingDeepLinkContext | null>(null);
export const usePendingDeepLink = () => React.useContext(Context);

type PendingDeepLinkProviderProps = {
  children: React.ReactNode;
  initialPendingDeepLink?: string;
};

export function PendingDeepLinkProvider({
  children,
  initialPendingDeepLink = '',
}: PendingDeepLinkProviderProps) {
  const [pendingDeepLink, setPendingDeepLink] = React.useState(initialPendingDeepLink);

  return (
    <Context.Provider value={{ pendingDeepLink, setPendingDeepLink }}>{children}</Context.Provider>
  );
}
