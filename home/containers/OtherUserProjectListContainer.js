/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import ProjectList from '../components/ProjectList';

const UsersAppsQuery = gql`
  query Home_UsersApps($username: String!, $limit: Int!, $offset: Int!) {
    user {
      byUsername(username: $username) {
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
        snacks(limit: 15, offset: 0) {
          name
          description
          fullName
          slug
        }
      }
    }
  }
`;

export default graphql(UsersAppsQuery, {
  props: props => {
    let { data } = props;
    let apps, appCount;
    if (data.user && data.user.byUsername) {
      apps = data.user.byUsername.apps;
      appCount = data.user.byUsername.appCount;
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
            if (!fetchMoreResult.user || !fetchMoreResult.user.byUsername) {
              return previousData;
            }

            let combinedData = {
              user: {
                ...previousData.user,
                ...fetchMoreResult.user,
                byUsername: {
                  ...previousData.user.byUsername,
                  ...fetchMoreResult.user.byUsername,
                  apps: [
                    ...previousData.user.byUsername.apps,
                    ...fetchMoreResult.user.byUsername.apps,
                  ],
                },
              },
            };

            return {
              ...combinedData,
              appCount: combinedData.user.byUsername.appCount,
              apps: combinedData.user.byUsername.apps,
            };
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
    fetchPolicy: 'cache-and-network',
  }),
})(ProjectList);
