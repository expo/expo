import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import ExploreTab from '../components/ExploreTab';

const PublicAppsQuery = gql`
  query FindPublicApps($limit: Int, $offset: Int, $filter: AppsFilter!) {
    apps: allPublicApps(limit: $limit, offset: $offset, sort: RECENTLY_PUBLISHED, filter: $filter) {
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
`;

export default graphql(PublicAppsQuery, {
  props: props => {
    let { data: { apps, fetchMore } } = props;

    return {
      ...props,
      loadMoreAsync() {
        return fetchMore({
          variables: {
            offset: apps.length,
          },
          updateQuery: (previousData, { fetchMoreResult }) => {
            if (!fetchMoreResult.data) {
              return previousResult;
            }

            return Object.assign({}, previousData, {
              apps: [...previousData.apps, ...fetchMoreResult.data.apps],
            });
          },
        });
      },
    };
  },
  options: props => ({
    variables: {
      filter: props.filter,
      limit: 10,
      offset: 0,
    },
  }),
})(ExploreTab);
