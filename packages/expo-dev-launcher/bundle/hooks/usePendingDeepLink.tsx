import * as React from 'react';

import { DeepLinkModal } from '../components/redesign/DeepLinkModal';
import { useModalStack } from '../components/redesign/Modal';
import { addDeepLinkListener, getPendingDeepLink } from '../native-modules/DevLauncherInternal';

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
  const modalStack = useModalStack();
  const [pendingDeepLink, setPendingDeepLink] = React.useState(initialPendingDeepLink);

  React.useEffect(() => {
    getPendingDeepLink().then((url) => {
      if (url) {
        setPendingDeepLink(url);
        modalStack.push({
          element: <DeepLinkModal pendingDeepLink={url} onClosePress={() => modalStack.pop()} />,
        });
      }
    });
  }, []);

  React.useEffect(() => {
    const listener = addDeepLinkListener((url) => {
      if (url) {
        setPendingDeepLink(url);
        modalStack.push({
          element: <DeepLinkModal pendingDeepLink={url} onClosePress={() => modalStack.pop()} />,
        });
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <Context.Provider value={{ pendingDeepLink, setPendingDeepLink }}>{children}</Context.Provider>
  );
}
