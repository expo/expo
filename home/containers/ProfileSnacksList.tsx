import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import SnackList, { Snack } from '../components/SnackList';

interface ProfileSnacksData {
  me: {
    id: string;
    snacks: Snack[];
  };
}

interface ProfileSnacksVars {
  limit: number;
  offset: number;
}

const ProfileSnacksQuery = gql`
  query Home_ProfileSnacks($limit: Int!, $offset: Int!) {
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

function useProfileSnacksQuery() {
  const { data, fetchMore } = useQuery<ProfileSnacksData, ProfileSnacksVars>(ProfileSnacksQuery, {
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

export function ProfileSnacksList() {
  const { data, loadMoreAsync } = useProfileSnacksQuery();
  return <SnackList data={data.snacks ?? []} loadMoreAsync={loadMoreAsync} />;
}
