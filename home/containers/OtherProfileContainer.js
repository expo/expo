/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const UserProfileQuery = gql`
  query Home_UserByUsername($username: String!) {
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

export default graphql(UserProfileQuery, {
  options: props => ({
    variables: {
      username: props.username ? props.username.replace('@', '') : '',
    },
    fetchPolicy: 'network-only',
  }),
  props: props => {
    return {
      ...props,
      data: {
        ...props.data,
        user: props.data.user ? props.data.user.byUsername : null,
      },
    };
  },
})(Profile);
