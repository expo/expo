import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import SnackList, { Snack } from '../components/SnackList';

interface MySnacksData {
  me: {
    id: string;
    snacks: Snack[];
  };
}

interface MySnacksVars {
  limit: number;
  offset: number;
}

const MySnacksQuery = gql`
  query Home_MySnacks($limit: Int!, $offset: Int!) {
    me {
      id
      snacks(limit: $limit, offset: $offset) {
        name
        description
        fullName
        slug
        isDraft
      }
    }
  }
`;

function useMySnacksQuery() {
  const { data, fetchMore } = useQuery<MySnacksData, MySnacksVars>(MySnacksQuery, {
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
            snacks: [...previousData.me.snacks, ...fetchMoreResult.me.snacks],
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

export function MySnacksList() {
  const { data, loadMoreAsync } = useMySnacksQuery();
  return <SnackList data={data.snacks ?? []} loadMoreAsync={loadMoreAsync} belongsToCurrentUser />;
}

const OtherSnacksQuery = gql`
  query Home_UsersSnacks($username: String!, $limit: Int!, $offset: Int!) {
    user {
      byUsername(username: $username) {
        id
        username

        snacks(limit: $limit, offset: $offset) {
          name
          description
          fullName
          slug
          isDraft
        }
      }
    }
  }
`;

interface OtherSnacksData {
  user: {
    byUsername: {
      id: string;
      username: string;
      snacks: Snack[];
    };
  };
}

interface OtherSnacksVars {
  username: string;
  limit: number;
  offset: number;
}

function useOtherSnacksQuery({ username }: { username: string }) {
  const { data, fetchMore } = useQuery<OtherSnacksData, OtherSnacksVars>(OtherSnacksQuery, {
    variables: {
      username: username.replace('@', ''),
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const snacks = data?.user?.byUsername?.snacks;

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: snacks?.length || 0,
      },
      updateQuery: (previousData, { fetchMoreResult }) => {
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
              snacks: [
                ...previousData.user.byUsername.snacks,
                ...fetchMoreResult.user.byUsername.snacks,
              ],
            },
          },
        };

        return {
          ...combinedData,
          snacks: combinedData.user.byUsername.snacks,
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

export function OtherSnacksList({ username }: { username: string }) {
  const { data, loadMoreAsync } = useOtherSnacksQuery({ username });
  return <SnackList data={data.snacks ?? []} loadMoreAsync={loadMoreAsync} />;
}
