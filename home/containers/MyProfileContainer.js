/* @flow */

import gql from 'graphql-tag';
import React, { useEffect } from 'react';
import { compose, graphql } from 'react-apollo';

import Profile from '../components/Profile';
import SessionActions from '../redux/SessionActions';

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
    }
  }
`;

function withAuthSessionVerification(Component) {
  return function AuthSessionVerification(props) {
    const { loading, error, user } = props.data;

    // We verify that the viewer is logged in when we receive data from the server; if the viewer
    // isn't logged in, we clear our locally stored credentials
    useEffect(() => {
      if (!loading && !error && !user) {
        props.dispatch(SessionActions.signOut());
      }
    }, [loading, error, user]);
    return <Component {...props} />;
  };
}

export default compose(
  graphql(MyProfileQuery, {
    props(props) {
      return {
        ...props,
        data: {
          ...props.data,
          user: props.data.me,
        },
      };
    },
    options: {
      fetchPolicy: 'cache-and-network',
    },
  }),
  withAuthSessionVerification
)(Profile);
