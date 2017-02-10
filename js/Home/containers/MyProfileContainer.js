import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const ownProfileQuery = gql`
  {
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
          packageName
          description
          lastPublishedTime
        }
        likes(limit: 15, offset: 0) {
          id
        }
      }
    }
  }
`

export default graphql(ownProfileQuery, {
  props: (props) => {
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
    forceFetch: true,
  },
})(Profile);
