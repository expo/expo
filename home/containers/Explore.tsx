import { useQuery } from '@apollo/client';
import { Project } from 'components/ProjectList';
import gql from 'graphql-tag';
import * as React from 'react';

import ExploreTab from '../components/ExploreTab';

interface ExploreData {
  app: { all: Project[] };
}

interface ExploreVars {
  filter: string;
  limit: number;
  offset: number;
}

const PublicAppsQuery = gql`
  query Home_FindPublicApps($limit: Int, $offset: Int, $filter: AppsFilter!) {
    app {
      all(limit: $limit, offset: $offset, sort: RECENTLY_PUBLISHED, filter: $filter) {
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
`;

function useExploreTabQuery(props: { filter: string }) {
  const query = useQuery<ExploreData, ExploreVars>(PublicAppsQuery, {
    variables: {
      filter: props.filter,
      limit: 10,
      offset: 0,
    },
    fetchPolicy: 'network-only',
  });

  const loadMoreAsync = React.useCallback(() => {
    return query.fetchMore({
      variables: {
        ...(props.filter ? { filter: props.filter } : {}),
        limit: 10,
        offset: query.data?.app.all?.length,
      },
      updateQuery(previousData, { fetchMoreResult }: { fetchMoreResult?: ExploreData }) {
        if (!fetchMoreResult?.app?.all) {
          return previousData;
        }

        const combinedData = {
          app: {
            ...previousData.app,
            ...fetchMoreResult.app,
            all: [...previousData.app.all, ...fetchMoreResult.app.all],
          },
        };

        return {
          ...combinedData,
          apps: combinedData.app.all,
        };
      },
    });
  }, [props.filter, query.data, query.fetchMore]);

  return {
    ...query,
    data: {
      ...query.data,
      apps: query?.data?.app?.all ?? undefined,
    },
    loadMoreAsync,
  };
}

export default function Explore(props: Pick<ExploreVars, 'filter'>) {
  const query = useExploreTabQuery({
    filter: props.filter,
  });
  return (
    <ExploreTab
      loadMoreAsync={query.loadMoreAsync}
      refetch={query.refetch}
      loading={query.loading}
      error={query.error}
      data={query.data}
    />
  );
}
