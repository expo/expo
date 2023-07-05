import format from 'date-fns/format';
import { Text } from 'expo-dev-client-components';
import { gql } from 'graphql-request';
import * as React from 'react';
import { Platform } from 'react-native';
import { useInfiniteQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { Toasts } from '../components/Toasts';
import { queryClient, useQueryOptions } from '../providers/QueryProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { primeCacheWithUpdates, Update } from './useUpdatesForBranch';

const query = gql`
  query getBranches(
    $appId: String!
    $offset: Int!
    $limit: Int!
    $runtimeVersion: String!
    $platform: AppPlatform!
  ) {
    app {
      byId(appId: $appId) {
        updateBranches(offset: $offset, limit: $limit) {
          id
          name

          compatibleUpdates: updates(
            offset: 0
            limit: 1
            filter: { runtimeVersions: [$runtimeVersion], platform: $platform }
          ) {
            id
          }

          updates: updates(offset: 0, limit: $limit, filter: { platform: $platform }) {
            id
            message
            runtimeVersion
            createdAt
            manifestPermalink
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

async function getBranchesAsync({
  appId,
  page = 1,
  runtimeVersion,
  pageSize,
}: {
  appId: string;
  page?: number;
  runtimeVersion: string;
  pageSize: number;
}) {
  if (appId !== '') {
    const offset = (page - 1) * pageSize;
    const variables = {
      appId,
      offset,
      limit: pageSize,
      runtimeVersion,
      platform: Platform.OS.toUpperCase(),
    };

    const branches: Branch[] = [];
    const incompatibleBranches: Branch[] = [];

    const response = await apiClient.request(query, variables);
    const updateBranches = response.app.byId.updateBranches;
    updateBranches.forEach((updateBranch) => {
      const branch: Branch = {
        id: updateBranch.id,
        name: updateBranch.name,
        updates: updateBranch.updates.map((update) => {
          return {
            ...update,
            createdAt: format(new Date(update.createdAt), 'MMMM d, yyyy, h:mma'),
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
  }

  return {
    branches: [],
    incompatibleBranches: [],
    page: 1,
  };
}

export function useBranchesForApp(appId: string, isAuthenticated: boolean) {
  const { runtimeVersion } = useUpdatesConfig();
  const toastStack = useToastStack();
  const { queryOptions } = useQueryOptions();
  const isEnabled = appId != null && isAuthenticated;

  const query = useInfiniteQuery(
    ['branches', appId, queryOptions.pageSize],
    ({ pageParam }) => {
      return getBranchesAsync({
        appId,
        page: pageParam,
        runtimeVersion,
        pageSize: queryOptions.pageSize,
      });
    },
    {
      retry: 3,
      refetchOnMount: false,
      enabled: !!isEnabled,
      getNextPageParam: (lastPage) => {
        const totalBranches = lastPage.incompatibleBranches.length + lastPage.branches.length;

        if (totalBranches < queryOptions.pageSize) {
          return undefined;
        }

        return lastPage?.page + 1;
      },
    }
  );

  React.useEffect(() => {
    if (query.error && isAuthenticated) {
      const doesNotHaveErrorShowing =
        toastStack.getItems().filter((i) => i.status === 'pushing' || i.status === 'settled')
          .length === 0;

      // @ts-ignore
      const errorMessage = query.error.message;

      if (doesNotHaveErrorShowing) {
        toastStack.push(() => (
          <Toasts.Error>
            <Text color="error" size="small">
              {errorMessage || `Something went wrong trying to fetch branches for this app`}
            </Text>
          </Toasts.Error>
        ));
      }
    }
  }, [query.error, isAuthenticated]);

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

export function prefetchBranchesForApp(appId: string, runtimeVersion: string, pageSize: number) {
  return queryClient.prefetchInfiniteQuery(['branches', appId, pageSize], ({ pageParam = 1 }) =>
    getBranchesAsync({ page: pageParam, appId, runtimeVersion, pageSize })
  );
}

export function primeCacheWithBranch(appId: string, branch: Branch) {
  return queryClient.setQueryData(['branches', appId, branch.name], branch);
}

export function resetBranchQueries() {
  return queryClient.resetQueries(['branches']);
}
