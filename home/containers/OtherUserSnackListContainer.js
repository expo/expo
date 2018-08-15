/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import SnackList from '../components/SnackList';

const UsersSnacksQuery = gql`
  query Home_UsersSnacks($username: String!, $limit: Int!, $offset: Int!) {
    user {
      byUsername(username: $username) {
        id
        username
        firstName
        lastName
        email
        profilePhoto
        isLegacy
        appCount
        apps(limit: 15, offset: 0) {
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
        snacks(limit: $limit, offset: $offset) {
          name
          description
          fullName
          slug
        }
      }
    }
  }
`;

export default graphql(UsersSnacksQuery, {
  props: props => {
    let { data } = props;
    let apps, appCount, snacks;
    if (data.user && data.user.byUsername) {
      apps = data.user.byUsername.apps;
      appCount = data.user.byUsername.appCount;
      snacks = data.user.byUsername.snacks;
    }

    return {
      ...props,
      data: {
        ...data,
        appCount,
        apps,
        snacks,
      },
      loadMoreAsync() {
        return data.fetchMore({
          variables: {
            offset: snacks.length,
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
                  snacks: [
                    ...previousData.user.byUsername.snacks,
                    ...fetchMoreResult.user.byUsername.snacks,
                  ],
                },
              },
            };

            return {
              ...combinedData,
              appCount: combinedData.user.byUsername.appCount,
              apps: combinedData.user.byUsername.apps,
              snacks: combinedData.user.byUsername.snacks,
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
})(SnackList);
