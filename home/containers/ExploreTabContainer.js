/* @flow */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import ExploreTab from '../components/ExploreTab';

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
        isLikedByMe
        likeCount
      }
    }
  }
`;

export default graphql(PublicAppsQuery, {
  props: props => {
    let { data } = props;

    return {
      ...props,
      data: {
        ...props.data,
        apps: data.app ? data.app.all : null,
      },
      loadMoreAsync() {
        return data.fetchMore({
          variables: {
            ...(props.filter ? { filter: props.filter } : {}),
            limit: 10,
            offset: data.apps.length,
          },
          updateQuery: (previousData, { fetchMoreResult }) => {
            const previousApps = previousData.app && previousData.app.all;
            if (!fetchMoreResult.data) {
              return previousData;
            }
            return Object.assign({}, previousData, {
              apps: [...previousApps, ...fetchMoreResult.data.app.all],
            });
          },
        });
      },
    };
  },
  options: props => ({
    fetchPolicy: 'network-only',
    variables: {
      filter: props.filter,
      limit: 10,
      offset: 0,
    },
  }),
})(ExploreTab);
