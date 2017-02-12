import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const MyProfileQuery = gql`
  query MyProfile {
    viewer {
      me {
        id
        username
        firstName
        lastName
        email
        profilePhoto
        appCount
        isLegacy
        apps(limit: 15, offset: 0) {
          id
          fullName
          iconUrl
          name
          packageName
          description
          lastPublishedTime
          likeCount
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
