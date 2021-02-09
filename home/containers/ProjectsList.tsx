import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import ProjectList, { Project } from '../components/ProjectList';

interface MyProjectsData {
  me: {
    id: string;
    appCount: number;
    email: string;
    firstName: string;
    isLegacy: boolean;
    lastName: string;
    profilePhoto: string;
    username: string;
    apps: Project[];
  };
}

interface MyProjectsVars {
  limit: number;
  offset: number;
}

const MyProjectsQuery = gql`
  query Home_MyApps($limit: Int!, $offset: Int!) {
    me {
      id
      appCount
      email
      firstName
      id
      isLegacy
      lastName
      profilePhoto
      username
      apps(limit: $limit, offset: $offset) {
        id
        description
        fullName
        iconUrl
        lastPublishedTime
        name
        packageUsername
        packageName
        privacy
        sdkVersion
      }
    }
  }
`;

function useMyProjectsQuery() {
  const { data, fetchMore, loading, error, refetch } = useQuery<MyProjectsData, MyProjectsVars>(
    MyProjectsQuery,
    {
      variables: {
        limit: 15,
        offset: 0,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

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

export function MyProjectsList() {
  const query = useMyProjectsQuery();
  return <ProjectList belongsToCurrentUser {...query} />;
}

interface OtherProjectsData {
  user: {
    byUsername: {
      id: string;
      appCount: number;
      apps: Project[];
    };
  };
}

interface OtherProjectsVars {
  username: string;
  limit: number;
  offset: number;
}

const OtherProjectsQuery = gql`
  query Home_UsersApps($username: String!, $limit: Int!, $offset: Int!) {
    user {
      byUsername(username: $username) {
        id
        appCount
        apps(limit: $limit, offset: $offset) {
          id
          fullName
          name
          iconUrl
          packageName
          packageUsername
          description
          lastPublishedTime
          sdkVersion
        }
      }
    }
  }
`;

function useOtherProjectsQuery({ username }: { username: string }) {
  const { data, fetchMore, loading, error, refetch } = useQuery<
    OtherProjectsData,
    OtherProjectsVars
  >(OtherProjectsQuery, {
    variables: {
      username: username.replace('@', ''),
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const apps = data?.user?.byUsername?.apps;
  const appCount = data?.user?.byUsername?.appCount;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: apps?.length || 0,
      },
      updateQuery(previousData, { fetchMoreResult }) {
        if (!fetchMoreResult?.user?.byUsername) {
          return previousData;
        }

        const combinedData = {
          user: {
            ...previousData.user,
            ...fetchMoreResult.user,
            byUsername: {
              ...previousData.user.byUsername,
              ...fetchMoreResult.user.byUsername,
              apps: [...previousData.user.byUsername.apps, ...fetchMoreResult.user.byUsername.apps],
            },
          },
        };

        return {
          ...combinedData,
          appCount: combinedData.user.byUsername.appCount,
          apps: combinedData.user.byUsername.apps,
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

export function OtherProjectsList(props: { username: string }) {
  const query = useOtherProjectsQuery(props);
  return <ProjectList {...props} {...query} />;
}
