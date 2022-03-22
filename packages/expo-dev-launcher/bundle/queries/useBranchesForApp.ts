import format from 'date-fns/format';
import { gql } from 'graphql-request';
import { useInfiniteQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { queryClient } from '../providers/QueryProvider';
import { primeCacheWithUpdates, Update, updatesPageSize } from './useUpdatesForBranch';

const query = gql`
  query getBranches($appId: String!, $offset: Int!, $limit: Int!, $updatesLimit: Int!) {
    app {
      byId(appId: $appId) {
        updateBranches(offset: $offset, limit: $limit) {
          id
          name
          updates(offset: 0, limit: $updatesLimit) {
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

export type Branch = {
  id: string;
  name: string;
  updates: Update[];
};

export const branchPageSize = 10;

function getBranchesAsync({ appId, page = 1 }: { appId: string; page?: number }) {
  const offset = (page - 1) * branchPageSize;
  const variables = { appId, offset, limit: branchPageSize, updatesLimit: updatesPageSize };
  const branches: Branch[] = [];

  return apiClient.request(query, variables).then((response) => {
    const updateBranches = response.app.byId.updateBranches;

    updateBranches.forEach((updateBranch) => {
      const branch: Branch = {
        id: updateBranch.id,
        name: updateBranch.name,
        updates: updateBranch.updates.map((update) => {
          return {
            ...update,
            createdAt: format(new Date(update.createdAt), 'MMMM d, yyyy, h:ma'),
          };
        }),
      };

      branches.push(branch);

      // side-effect: prime the cache with branches
      primeCacheWithBranch(appId, branch);

      // side-effect: prime the cache with the first paginated updates for a branch
      primeCacheWithUpdates(appId, branch.name, branch.updates);
    });

    return {
      branches,
      page,
    };
  });
}

export function useBranchesForApp(appId: string) {
  const query = useInfiniteQuery(
    ['branches', appId],
    ({ pageParam }) => {
      return getBranchesAsync({ appId, page: pageParam });
    },
    {
      refetchOnMount: false,
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.branches.length < branchPageSize) {
          return undefined;
        }

        return lastPage?.page + 1;
      },
    }
  );

  const branches =
    query.data?.pages
      .flatMap((page) => page.branches)
      .filter((branch) => branch.updates.length > 0) ?? [];

  return {
    ...query,
    data: branches,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: !query.isLoading && query.isFetchingNextPage,
  };
}

export function prefetchBranchesForApp(appId: string) {
  return queryClient.prefetchInfiniteQuery(['branches', appId], ({ pageParam = 1 }) =>
    getBranchesAsync({ page: pageParam, appId })
  );
}

export function primeCacheWithBranch(appId: string, branch: Branch) {
  return queryClient.setQueryData(['branches', appId, branch.name], branch);
}
