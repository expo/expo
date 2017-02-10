import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const otherProfileQuery = gql`
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
        fullName
        name
        iconUrl
        packageName
        packageUsername
        description
        lastPublishedTime
      }
    }
  }
`;

export default graphql(otherProfileQuery, {
  options: (props) => ({
    variables: {
      username: props.username.replace('@',''),
    },
    returnPartialData: true,
    forceFetch: true,
  })
})(Profile);
