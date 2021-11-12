import * as React from 'react';

import { getLocalPackagersAsync } from '../functions/getLocalPackagersAsync';
import { sleepAsync } from '../functions/sleepAsync';
import { useIsMounted } from '../hooks/useIsMounted';

type PollOptions = {
  pollAmount?: number;
  pollInterval?: number;
};

export function useLocalPackagers() {
  const [isFetching, setIsFetching] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [isPolling, setIsPolling] = React.useState(false);

  const isMounted = useIsMounted();

  async function fetchPackagersAsync() {
    setIsFetching(true);
    const data = await getLocalPackagersAsync();
    setData(data);
    setIsFetching(false);
  }

  React.useEffect(() => {
    fetchPackagersAsync();
  }, []);

  async function pollAsync({ pollAmount = 5, pollInterval = 1000 }: PollOptions) {
    let fetchCount = 0;
    setIsPolling(true);

    while (fetchCount < pollAmount) {
      await fetchPackagersAsync();
      await sleepAsync(pollInterval);
      fetchCount += 1;
    }

    if (isMounted()) {
      setIsPolling(false);
    }
  }

  return {
    data,
    pollAsync,
    isFetching: isFetching || isPolling,
  };
}
