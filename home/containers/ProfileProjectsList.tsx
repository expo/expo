import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import ProjectList, { Project } from '../components/ProjectList';

interface ProfileProjectsData {
  me: {
    id: string;
    appCount: number;
    apps: Project[];
  };
}

interface ProfileProjectsVars {
  limit: number;
  offset: number;
}

const ProfileProjectsQuery = gql`
  query Home_MyApps($limit: Int!, $offset: Int!) {
    me {
      id
      appCount
      apps(limit: $limit, offset: $offset) {
        id
        description
        fullName
        iconUrl
        lastPublishedTime
        name
        username
        packageName
        privacy
        sdkVersion
      }
    }
  }
`;

function useProfileProjectsQuery() {
  const { data, fetchMore, loading, error, refetch } = useQuery<
    ProfileProjectsData,
    ProfileProjectsVars
  >(ProfileProjectsQuery, {
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
            apps: [...previousData.me.apps, ...fetchMoreResult.me.apps],
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
