/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import SnackList from '../components/SnackList';

const MySnacksQuery = gql`
  query Home_MySnacks($limit: Int!, $offset: Int!) {
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
      apps(limit: 15, offset: 0) {
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
      snacks(limit: $limit, offset: $offset) {
        name
        fullName
        slug
        description
      }
      likes(limit: 15, offset: 0) {
        id
      }
    }
  }
`;

export default graphql(MySnacksQuery, {
  props: props => {
    let { data } = props;

    let apps, appCount, snacks;
    if (data.me) {
      apps = data.me.apps;
      appCount = data.me.appCount;
      snacks = data.me.snacks;
    }

    return {
      ...props,
      data: {
        ...data,
        apps,
        appCount,
        snacks,
      },
      loadMoreAsync() {
        return data.fetchMore({
          variables: {
            offset: (snacks && snacks.length) || 0,
          },
          updateQuery: (previousData, { fetchMoreResult }) => {
            if (!fetchMoreResult || !fetchMoreResult.me) {
              return previousData;
            }

            let combinedData = {
              me: {
                ...previousData.me,
                ...fetchMoreResult.me,
                snacks: [...previousData.me.snacks, ...fetchMoreResult.me.snacks],
              },
            };

            return {
              ...combinedData,
              appCount: combinedData.me.appCount,
              apps: combinedData.me.apps,
              snacks: combinedData.me.snacks,
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
})(SnackList);
