import * as React from 'react';

import { getDevSessionsAsync } from '../functions/getDevSessionsAsync';
import { sleepAsync } from '../functions/sleepAsync';
import { useIsMounted } from '../hooks/useIsMounted';
import { useUser } from '../providers/UserContextProvider';
import { DevSession } from '../types';

type PollOptions = {
  pollAmount?: number;
  pollInterval?: number;
};

type DevSessionsContext = {
  devSessions: DevSession[];
  setDevSessions: (devSessions: DevSession[]) => void;
};

const Context = React.createContext<DevSessionsContext | null>(null);

type DevSessionsProviderProps = {
  children: React.ReactNode;
  initialDevSessions?: DevSession[];
};

export function DevSessionsProvider({
  children,
  initialDevSessions = [],
}: DevSessionsProviderProps) {
  const [devSessions, setDevSessions] = React.useState<DevSession[]>(initialDevSessions);

  return <Context.Provider value={{ devSessions, setDevSessions }}>{children}</Context.Provider>;
}

export function useDevSessions() {
  const { devSessions, setDevSessions } = React.useContext(Context);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const isMounted = useIsMounted();
  const { isAuthenticated } = useUser();

  async function fetchDevSessionsAsync() {
    setIsFetching(true);
    const devSessions = await getDevSessionsAsync({ isAuthenticated });
    setDevSessions(devSessions);
    setIsFetching(false);
  }

  const pollAsync = React.useCallback(
    async ({ pollAmount = 5, pollInterval = 1000 }: PollOptions) => {
      setIsPolling(true);

      if (pollAmount > 0 && isMounted()) {
        await fetchDevSessionsAsync();
        await sleepAsync(pollInterval);
        pollAsync({ pollAmount: pollAmount - 1, pollInterval });
      }

      if (pollAmount === 0 && isMounted()) {
        setIsPolling(false);
      }
    },
    [isAuthenticated]
  );

  return {
    data: devSessions,
    pollAsync,
    isFetching: isFetching || isPolling,
  };
}
