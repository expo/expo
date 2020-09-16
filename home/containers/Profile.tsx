import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import ProfileView, { Profile, ProfileViewProps } from '../components/Profile';
import { useDispatch } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';

const APP_LIMIT = 7;
const SNACK_LIMIT = 4;

interface MyProfileData {
  me: Profile;
}

interface MyProfileVars {}

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
      apps(limit: ${APP_LIMIT}, offset: 0) {
        id
        description
        fullName
        iconUrl
        lastPublishedTime
        name
        packageName
        sdkVersion
        privacy
      }
      snacks(limit: ${SNACK_LIMIT}, offset: 0) {
        name
        description
        fullName
        slug
      }
    }
  }
`;

function useMyProfileQuery() {
  const query = useQuery<MyProfileData, MyProfileVars>(MyProfileQuery, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    ...query,
    data: {
      ...query.data,
      user: query.data?.me,
    },
  };
}

export function MyProfile(props: ProfileViewProps) {
  const dispatch = useDispatch();
  const query = useMyProfileQuery();
  const { loading, error, data } = query;

  // We verify that the viewer is logged in when we receive data from the server; if the viewer
  // isn't logged in, we clear our locally stored credentials
  React.useEffect(() => {
    if (!loading && !error && !data.user) {
      dispatch(SessionActions.signOut());
    }
  }, [loading, error, data.user]);

  return <ProfileView {...props} {...query} />;
}

interface OtherProfileData {
  user: { byUsername: Profile };
}

interface OtherProfileVars {
  username: string;
}

const OtherProfileQuery = gql`
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
        apps(limit: ${APP_LIMIT}, offset: 0) {
          id
          fullName
          name
          iconUrl
          packageName
          packageUsername
          description
          sdkVersion
          lastPublishedTime
        }
        snacks(limit: ${SNACK_LIMIT}, offset: 0) {
          name
          description
          fullName
          slug
        }
      }
    }
  }
`;

function useOtherProfileQuery({ username }: Pick<ProfileViewProps, 'username'>) {
  const query = useQuery<OtherProfileData, OtherProfileVars>(OtherProfileQuery, {
    fetchPolicy: 'network-only',
    variables: {
      username: username ? username.replace('@', '') : '',
    },
  });

  return {
    ...query,
    data: {
      ...query.data,
      user: query.data?.user ? query.data.user?.byUsername : null,
    },
  };
}

export function OtherProfile(props: ProfileViewProps) {
  const query = useOtherProfileQuery(props);
  return <ProfileView {...props} {...query} />;
}
