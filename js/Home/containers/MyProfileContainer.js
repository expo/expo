/* @flow */

import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const MyProfileQuery = gql`
  query MyProfile {
    viewer {
      me {
        appCount
        email
        firstName
        id
        isLegacy
        lastName
        profilePhoto
        username
        apps(limit: 15, offset: 0) {
          description
          fullName
          iconUrl
          id
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

export default graphql(MyProfileQuery, {
  props: props => {
    let { data } = props;
    let user;
    if (data.viewer && data.viewer.me) {
      user = data.viewer.me;
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
    returnPartialData: true,
    forceFetch: true,
  },
})(Profile);
