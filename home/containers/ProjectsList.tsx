import { useQuery } from '@apollo/client';
import * as React from 'react';

import ProjectList from '../components/ProjectList';
import { Home_AccountAppsDocument } from '../graphql/types';

function useOtherProjectsQuery({ accountName }: { accountName: string }) {
  const { data, fetchMore, loading, error, refetch } = useQuery(Home_AccountAppsDocument, {
    variables: {
      accountName,
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const apps = data?.account.byName.apps;
  const appCount = data?.account.byName.appCount;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: apps?.length || 0,
      },
      updateQuery(previousData, { fetchMoreResult }) {
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
              apps: [...previousData.account.byName.apps, ...fetchMoreResult.account.byName.apps],
            },
          },
        };
      },
    });
  }, [fetchMore, apps]);

  return {
    loading,
    error,
    refetch,
    data: {
      ...data,
      appCount,
      apps,
    },
    loadMoreAsync,
  };
}

export default function ProjectsList(props: { accountName: string }) {
  const query = useOtherProjectsQuery(props);
  return <ProjectList {...props} {...query} />;
}
