import format from 'date-fns/format';
import { gql } from 'graphql-request';
import * as React from 'react';
import { useInfiniteQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { Toasts } from '../components/Toasts';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { queryClient } from '../providers/QueryProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { primeCacheWithUpdates, Update, updatesPageSize } from './useUpdatesForBranch';

const query = gql`
  query getBranches(
    $appId: String!
    $offset: Int!
    $limit: Int!
    $updatesLimit: Int!
    $runtimeVersion: String!
  ) {
    app {
      byId(appId: $appId) {
        updateBranches(offset: $offset, limit: $limit) {
          id
          name

          compatibleUpdates: updates(
            offset: 0
            limit: 1
            filter: { runtimeVersions: [$runtimeVersion] }
          ) {
            id
          }

          updates: updates(offset: 0, limit: $updatesLimit) {
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

function getBranchesAsync({
  appId,
  page = 1,
  runtimeVersion,
}: {
  appId: string;
  page?: number;
  runtimeVersion: string;
}) {
  if (appId != '') {
    const offset = (page - 1) * branchPageSize;
    const variables = {
      appId,
      offset,
      limit: branchPageSize,
      updatesLimit: updatesPageSize,
      runtimeVersion,
    };

    const branches: Branch[] = [];
    const incompatibleBranches: Branch[] = [];

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

        const hasNoUpdates = updateBranch.updates.length === 0;
        const isCompatible = hasNoUpdates || updateBranch.compatibleUpdates.length > 0;

        if (isCompatible) {
          branches.push(branch);
        } else {
          incompatibleBranches.push(branch);
        }

        // side-effect: prime the cache with branches
        primeCacheWithBranch(appId, branch);

        // side-effect: prime the cache with the first paginated updates for a branch
        primeCacheWithUpdates(appId, branch.name, branch.updates);
      });

      return {
        branches,
        incompatibleBranches,
        page,
      };
    });
  }

  return {
    branches: [],
    incompatibleBranches: [],
    page: 1,
  };
}

export function useBranchesForApp(appId: string) {
  const { runtimeVersion } = useBuildInfo();
  const toastStack = useToastStack();

  const query = useInfiniteQuery(
    ['branches', appId],
    ({ pageParam }) => {
      return getBranchesAsync({ appId, page: pageParam, runtimeVersion });
    },
    {
      retry: appId !== '',
      refetchOnMount: false,
      enabled: appId !== '',
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.branches.length < branchPageSize) {
          return undefined;
        }

        return lastPage?.page + 1;
      },
    }
  );

  React.useEffect(() => {
    if (query.error) {
      toastStack.push(() => (
        <Toasts.Error>Something went wrong trying to fetch branches for this app</Toasts.Error>
      ));
    }
  }, [query.error]);

  const branches =
    query.data?.pages
      .flatMap((page) => page.branches)
      .filter((branch) => branch.updates.length > 0) ?? [];

  // incompatible branches are branches that have no compatible updates with the current runtimeVersion
  const incompatibleBranches =
    query?.data?.pages.flatMap((page) => page.incompatibleBranches) ?? [];

  // emptyBranches are branches that have no updates and have been created recently
  const emptyBranches =
    query?.data?.pages[0].branches.filter((branch) => branch.updates.length === 0) ?? [];

  return {
    ...query,
    data: branches,
    emptyBranches,
    incompatibleBranches,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: !query.isLoading && query.isFetchingNextPage,
  };
}

export function prefetchBranchesForApp(appId: string, runtimeVersion: string) {
  return queryClient.prefetchInfiniteQuery(['branches', appId], ({ pageParam = 1 }) =>
    getBranchesAsync({ page: pageParam, appId, runtimeVersion })
  );
}

export function primeCacheWithBranch(appId: string, branch: Branch) {
  return queryClient.setQueryData(['branches', appId, branch.name], branch);
}

export function resetBranchQueries() {
  return queryClient.resetQueries(['branches']);
}
