import { useQuery } from '@apollo/client';
import * as React from 'react';

import SnackList from '../components/SnackList';
import { Home_ProfileSnacksDocument } from '../graphql/types';

function useProfileSnacksQuery() {
  const { data, fetchMore } = useQuery(Home_ProfileSnacksDocument, {
    variables: {
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const snacks = data?.me?.snacks;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: snacks?.length || 0,
      },
      updateQuery(previousData, { fetchMoreResult }) {
        if (!fetchMoreResult?.me) {
          return previousData;
        }
        const combinedData = {
          me: {
            ...previousData.me,
            ...fetchMoreResult.me,
            snacks: [...(previousData.me?.snacks ?? []), ...fetchMoreResult.me.snacks],
          },
        };

        return {
          ...combinedData,
          snacks: combinedData.me.snacks,
        };
      },
    });
  }, [fetchMore, snacks]);

  return {
    data: {
      ...data,
      snacks,
    },
    loadMoreAsync,
  };
}

export function ProfileSnacksList() {
  const { data, loadMoreAsync } = useProfileSnacksQuery();
  return <SnackList data={data.snacks ?? []} loadMoreAsync={loadMoreAsync} />;
}
