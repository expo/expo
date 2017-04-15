/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import ProjectList from '../components/ProjectList';

const UsersAppsQuery = gql`
  query UsersApps($username: String!, $limit: Int!, $offset: Int!) {
    usersApps: userByUsername(username: $username) {
      id
      appCount
      apps(limit: $limit, offset: $offset) {
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

export default graphql(UsersAppsQuery, {
  props: props => {
    let { data } = props;
    let apps, appCount;
    if (data.usersApps) {
      apps = data.usersApps.apps;
      appCount = data.usersApps.appCount;
    }

    return {
      ...props,
      data: {
        ...data,
        appCount,
        apps,
      },
      loadMoreAsync() {
        return data.fetchMore({
          variables: {
            offset: apps.length,
          },
          updateQuery: (previousData, { fetchMoreResult }) => {
            if (!fetchMoreResult.data) {
              return previousData;
            }

            return Object.assign({}, previousData, {
              usersApps: {
                ...fetchMoreResult.data.usersApps,
                apps: [
                  ...previousData.usersApps.apps,
                  ...fetchMoreResult.data.usersApps.apps,
                ],
              },
            });
          },
        });
      },
    };
  },
  options: props => ({
    variables: {
      username: props.username.replace('@', ''),
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'network-only',
  }),
})(ProjectList);
