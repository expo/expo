/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const UserProfileQuery = gql`
  query findUserByUsername($username: String!) {
    user: userByUsername(username: $username) {
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
    }
  }
`;

export default graphql(UserProfileQuery, {
  options: props => ({
    variables: {
      username: props.username.replace('@', ''),
    },
    fetchPolicy: 'network-only',
  }),
})(Profile);
