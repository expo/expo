import format from 'date-fns/format';
import { gql } from 'graphql-request';
import React from 'react';
import { Platform } from 'react-native';
import { useInfiniteQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { Toasts } from '../components/Toasts';
import { queryClient, useQueryOptions } from '../providers/QueryProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';

export type Update = {
  id: string;
  message: string;
  runtimeVersion: string;
  createdAt: string;
  manifestPermalink: string;
};

const query = gql`
  query getUpdates(
    $appId: String!
    $branchName: String!
    $offset: Int!
    $limit: Int!
    $platform: AppPlatform!
  ) {
    app {
      byId(appId: $appId) {
        updateBranchByName(name: $branchName) {
          updates(offset: $offset, limit: $limit, filter: { platform: $platform }) {
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

function getUpdatesForBranchAsync(
  appId: string,
  branchName: string,
  page: number,
  pageSize: number
) {
  const offset = (page - 1) * pageSize;
  const variables = {
    appId,
    branchName,
    offset,
    limit: pageSize,
    platform: Platform.OS.toUpperCase(),
  };

  return apiClient.request(query, variables).then((response) => {
    const updateBranch = response.app.byId.updateBranchByName;

    const updates: Update[] = updateBranch.updates.map((update) => {
      return {
        ...update,
        createdAt: format(new Date(update.createdAt), 'MMMM d, yyyy, h:mma'),
      };
    });

    return {
      updates,
      page,
    };
  });
}

export function useUpdatesForBranch(branchName: string) {
  const { appId } = useUpdatesConfig();
  const toastStack = useToastStack();
  const { queryOptions } = useQueryOptions();

  const query = useInfiniteQuery(
    ['updates', appId, branchName, queryOptions.pageSize],
    ({ pageParam = 1 }) =>
      getUpdatesForBranchAsync(appId, branchName, pageParam, queryOptions.pageSize),
    {
      refetchOnMount: false,
      getNextPageParam: (previousPage) => {
        if (previousPage.updates.length < queryOptions.pageSize) {
          return undefined;
        }

        return previousPage.page + 1;
      },
    }
  );

  const updates = query.data?.pages.flatMap((page) => page.updates) ?? [];

  React.useEffect(() => {
    if (query.error) {
      toastStack.push(() => (
        <Toasts.Error>Something went wrong trying to fetch updates for this branch</Toasts.Error>
      ));
    }
  }, [query.error]);

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
