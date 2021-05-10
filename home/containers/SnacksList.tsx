import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import SnackList, { Snack } from '../components/SnackList';

const SnacksQuery = gql`
  query Home_AccountSnacks($accountName: String!, $limit: Int!, $offset: Int!) {
    account {
      byName(accountName: $accountName) {
        id
        name
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

interface SnacksData {
  account: {
    byName: {
      id: string;
      name: string;
      snacks: Snack[];
    };
  };
}

interface SnacksVars {
  accountName: string;
  limit: number;
  offset: number;
}

function useSnacksQuery({ accountName }: { accountName: string }) {
  const { data, fetchMore } = useQuery<SnacksData, SnacksVars>(SnacksQuery, {
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
