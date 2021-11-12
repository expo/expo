import * as React from 'react';

import SnackList from '../components/SnackList';
import { useHome_AccountSnacksQuery } from '../graphql/types';

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
      updateQuery: (previousData, { fetchMoreResult }) => {
        if (!fetchMoreResult?.account?.byName) {
          return previousData;
        }
        return {
          account: {
            ...previousData.account,
            ...fetchMoreResult.account,
            byName: {
              ...previousData.account.byName,
              ...fetchMoreResult.account.byName,
              snacks: [
                ...previousData.account.byName.snacks,
                ...fetchMoreResult.account.byName.snacks,
              ],
            },
          },
        };
      },
    });
  }, [fetchMore, snacks]);

  return {
    snacks,
    loadMoreAsync,
  };
}

export default function SnacksList({ accountName }: { accountName: string }) {
  const { snacks, loadMoreAsync } = useSnacksQuery({ accountName });
  return <SnackList data={snacks ?? []} loadMoreAsync={loadMoreAsync} />;
}
