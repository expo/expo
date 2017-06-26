/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import ProjectList from '../components/ProjectList';

const MyAppsQuery = gql`
  query Home_MyApps($limit: Int!, $offset: Int!) {
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
`;

export default graphql(MyAppsQuery, {
  props: props => {
    let { data } = props;

    return {
      ...props,
      data: {
        ...data,
        appCount: data.me.appCount,
        apps: data.me.apps,
      },
      loadMoreAsync() {
        return data.fetchMore({
          variables: {
            offset: (data.me && data.me.apps && data.me.apps.length) || 0,
          },
          updateQuery: (previousData, { fetchMoreResult }) => {
            if (!fetchMoreResult || !fetchMoreResult.me) {
              return previousData;
            }

            let combinedData = {
              me: {
                ...previousData.me,
                ...fetchMoreResult.me,
                apps: [...previousData.me.apps, ...fetchMoreResult.me.apps],
              },
            };

            return {
              ...combinedData,
              appCount: combinedData.me.appCount,
              apps: combinedData.me.apps,
            };
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
