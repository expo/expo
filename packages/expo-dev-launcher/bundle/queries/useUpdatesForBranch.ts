import format from 'date-fns/format';
import { gql } from 'graphql-request';
import { useInfiniteQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { queryClient } from '../providers/QueryProvider';

export type Update = {
  id: string;
  message: string;
  runtimeVersion: string;
  createdAt: string;
};

const query = gql`
  query getUpdates($appId: String!, $branchName: String!, $offset: Int!, $limit: Int!) {
    app {
      byId(appId: $appId) {
        updateBranchByName(name: $branchName) {
          updates(offset: $offset, limit: $limit) {
            id
            message
            runtimeVersion
            createdAt
          }
        }
      }
    }
  }
`;

export const updatesPageSize = 10;

function getUpdatesForBranchAsync(appId: string, branchName: string, page: number) {
  const offset = (page - 1) * updatesPageSize;
  const variables = { appId, branchName, offset, limit: updatesPageSize };

  return apiClient.request(query, variables).then((response) => {
    const updateBranch = response.app.byId.updateBranchByName;

    const updates: Update[] = updateBranch.updates.map((update) => {
      return {
        ...update,
        createdAt: format(new Date(update.createdAt), 'MMMM d, yyyy, h:ma'),
      };
    });

    return {
      updates,
      page,
    };
  });
}

export function useUpdatesForBranch(branchName: string) {
  const { appId } = useBuildInfo();

  const query = useInfiniteQuery(
    ['updates', appId, branchName],
    ({ pageParam = 1 }) => getUpdatesForBranchAsync(appId, branchName, pageParam),
    {
      refetchOnMount: false,
      getNextPageParam: (previousPage) => {
        if (previousPage.updates.length < updatesPageSize) {
          return undefined;
        }

        return previousPage.page + 1;
      },
    }
  );

  const updates = query.data?.pages.flatMap((page) => page.updates) ?? [];

  return {
    ...query,
    data: updates,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: !query.isLoading && query.isFetchingNextPage,
  };
}

export function primeCacheWithUpdates(appId: string, branchName: string, updates: Update[]) {
  queryClient.setQueryData(['updates', appId, branchName], {
    pages: [
      {
        updates,
        page: 1,
      },
    ],
    pageParams: [1],
  });
}
