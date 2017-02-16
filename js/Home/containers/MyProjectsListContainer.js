/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import ProjectList from '../components/ProjectList';

const MyAppsQuery = gql`
  query MyApps($limit: Int!, $offset: Int!){
    viewer {
      me {
        id
        appCount
        apps(limit: $limit, offset: $offset) {
          id
          fullName
          name
          iconUrl
          packageName
          description
          lastPublishedTime
          likeCount
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
            if (!fetchMoreResult.data) {
              return previousResult;
            }

            return Object.assign({}, previousData, {
              viewer: {
                me: {
                  ...fetchMoreResult.data.viewer.me,
                  apps: [
                    ...previousData.viewer.me.apps,
                    ...fetchMoreResult.data.viewer.me.apps,
                  ],
                },
              },
            });
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
  },
})(ProjectList);
