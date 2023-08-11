import * as React from 'react';

import { SnackListView } from './SnackList';
import { useHome_AccountSnacksQuery } from '../../graphql/types';

function useSnacksQuery({ accountName }: { accountName: string }) {
  const { data, fetchMore } = useHome_AccountSnacksQuery({
    variables: {
      accountName,
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const snacks = data?.account.byName.snacks;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: snacks?.length || 0,
      },
    });
  }, [fetchMore, snacks]);

  return {
    snacks,
    loadMoreAsync,
  };
}

export function SnacksList({ accountName }: { accountName: string }) {
  const { snacks, loadMoreAsync } = useSnacksQuery({ accountName });
  return <SnackListView data={snacks ?? []} loadMoreAsync={loadMoreAsync} />;
}
