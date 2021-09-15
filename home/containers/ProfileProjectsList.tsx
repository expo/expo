import { useQuery } from '@apollo/client';
import * as React from 'react';

import ProjectList from '../components/ProjectList';
import { Home_MyAppsDocument } from '../graphql/types';

function useProfileProjectsQuery() {
  const { data, fetchMore, loading, error, refetch } = useQuery(Home_MyAppsDocument, {
    variables: {
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const apps = data?.me?.apps;
  const appCount = data?.me?.appCount;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: apps?.length || 0,
      },
      updateQuery(previousData, { fetchMoreResult }) {
        if (!fetchMoreResult?.me) {
          return previousData;
        }

        const combinedData = {
          me: {
            ...previousData.me,
            ...fetchMoreResult.me,
            apps: [...(previousData.me?.apps ?? []), ...fetchMoreResult.me.apps],
          },
        };

        return {
          ...combinedData,
          appCount: combinedData.me.appCount,
          apps: combinedData.me.apps,
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
      apps,
      appCount,
    },
    loadMoreAsync,
  };
}

export function ProfileProjectsList() {
  const query = useProfileProjectsQuery();
  return <ProjectList {...query} />;
}
