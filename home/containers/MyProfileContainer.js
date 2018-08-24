/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const MyProfileQuery = gql`
  query Home_MyProfile {
    me {
      id
      appCount
      email
      firstName
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
      snacks(limit: 15, offset: 0) {
        name
        description
        fullName
        slug
      }
      likes(limit: 15, offset: 0) {
        id
      }
    }
  }
`;

export default graphql(MyProfileQuery, {
  props: props => {
    let { data } = props;
    let user;
    if (data.me) {
      user = data.me;
    }

    return {
      ...props,
      data: {
        ...data,
        user,
      },
    };
  },
  options: {
    fetchPolicy: 'cache-and-network',
  },
})(Profile);
