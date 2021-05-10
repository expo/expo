import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import ProjectList, { Project } from '../components/ProjectList';

interface ProjectsData {
  account: {
    byName: {
      id: string;
      appCount: number;
      apps: Project[];
    };
  };
}

interface ProjectsVars {
  accountName: string;
  limit: number;
  offset: number;
}

const ProjectsQuery = gql`
  query Home_AccountApps($accountName: String!, $limit: Int!, $offset: Int!) {
    account {
      byName(accountName: $accountName) {
        id
        appCount
        apps(limit: $limit, offset: $offset) {
          id
          fullName
          name
          iconUrl
          packageName
          username
          description
          lastPublishedTime
          sdkVersion
        }
      }
    }
  }
`;

function useOtherProjectsQuery({ accountName }: { accountName: string }) {
  const { data, fetchMore, loading, error, refetch } = useQuery<ProjectsData, ProjectsVars>(
    ProjectsQuery,
    {
      variables: {
        accountName,
        limit: 15,
        offset: 0,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

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
