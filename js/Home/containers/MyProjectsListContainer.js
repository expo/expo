/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import ProjectList from '../components/ProjectList';

const MyAppsQuery = gql`
  query MyApps($limit: Int!, $offset: Int!) {
    viewer {
      me {
        id
        appCount
        email
        firstName
        id
        isLegacy
        lastName
        profilePhoto
        username
        apps(limit: $limit, offset: $offset) {
          id
          description
          fullName
          iconUrl
          lastPublishedTime
          likeCount
          name
          packageName
          privacy
        }
        likes(limit: 15, offset: 0) {
          id
        }
      }
    }
  }
`;

export default graphql(MyAppsQuery, {
  props: props => {
    let { data } = props;
    let apps, appCount;
    if (data.viewer && data.viewer.me) {
      apps = data.viewer.me.apps;
      appCount = data.viewer.me.appCount;
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
            if (!fetchMoreResult || !fetchMoreResult.viewer) {
              return previousData;
            }

            let result = {
              viewer: {
                me: {
                  ...previousData.viewer.me,
                  ...fetchMoreResult.viewer.me,
                  apps: [
                    ...previousData.viewer.me.apps,
                    ...fetchMoreResult.viewer.me.apps,
                  ],
                },
              },
            };

            return result;
          },
        });
      },
    };
  },
  options: {
    variables: {
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  },
})(ProjectList);
