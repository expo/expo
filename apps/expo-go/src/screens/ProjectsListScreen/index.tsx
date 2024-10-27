import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { ProjectList } from './ProjectList';
import { AppPlatform, useHome_AccountAppsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

function useProjectsForAccountQuery({ accountName }: { accountName: string }) {
  const { data, fetchMore, loading, error, refetch } = useHome_AccountAppsQuery({
    variables: {
      accountName,
      limit: 15,
      offset: 0,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
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

export function ProjectsListScreen({ route }: StackScreenProps<HomeStackRoutes, 'ProjectsList'>) {
  const accountName = route.params.accountName;

  const query = useProjectsForAccountQuery({ accountName });

  return <ProjectList {...query} />;
}
