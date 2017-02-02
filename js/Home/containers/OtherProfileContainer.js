import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import Profile from '../components/Profile';

const otherProfileQuery = gql`
  query findUserByUsername($username: String!) {
    user: userByUsername(username: $username) {
      username
      firstName
      lastName
      email
      profilePhoto
      apps {
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
      username: props.username,
    }
  })
})(Profile);
