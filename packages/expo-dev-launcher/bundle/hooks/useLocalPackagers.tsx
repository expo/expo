import * as React from 'react';

import { getLocalPackagersAsync, Packager } from '../functions/getLocalPackagersAsync';
import { sleepAsync } from '../functions/sleepAsync';
import { useIsMounted } from '../hooks/useIsMounted';

type PollOptions = {
  pollAmount?: number;
  pollInterval?: number;
};

type PackagersContext = {
  packagers: Packager[];
  setPackagers: (packagers: Packager[]) => void;
};

const Context = React.createContext<PackagersContext | null>(null);

type LocalPackagersProviderProps = {
  children: React.ReactNode;
  initialPackagers?: Packager[];
};

export function LocalPackagersProvider({
  children,
  initialPackagers,
}: LocalPackagersProviderProps) {
  const [packagers, setPackagers] = React.useState<Packager[]>(initialPackagers);

  return <Context.Provider value={{ packagers, setPackagers }}>{children}</Context.Provider>;
}

export function useLocalPackagers() {
  const { packagers, setPackagers } = React.useContext(Context);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const isMounted = useIsMounted();

  async function fetchPackagersAsync() {
    setIsFetching(true);
    const packagers = await getLocalPackagersAsync();
    setPackagers(packagers);
    setIsFetching(false);
  }

  async function pollAsync({ pollAmount = 5, pollInterval = 1000 }: PollOptions) {
    let fetchCount = 0;
    setIsPolling(true);

    while (fetchCount < pollAmount && isMounted()) {
      await fetchPackagersAsync();
      await sleepAsync(pollInterval);
      fetchCount += 1;
    }

    if (isMounted()) {
      setIsPolling(false);
    }
  }

  return {
    data: packagers,
    pollAsync,
    isFetching: isFetching || isPolling,
  };
}
