import { useQuery } from '@apollo/client';
import { StackScreenProps } from '@react-navigation/stack';
import { Project } from 'components/ProjectList';
import { Snack } from 'components/SnackList';
import gql from 'graphql-tag';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import ProfileView from '../components/ProfileView';
import { useDispatch } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';

const APP_LIMIT = 3;
const SNACK_LIMIT = 3;

export interface ProfileData {
  me: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profilePhoto: string;
    accounts: {
      id: string;
      name: string;
    }[];
    appCount: number;
    apps: Project[];
    snacks: Snack[];
  };
}

interface ProfileVars {}

const ProfileDataQuery = gql`
  query Home_ProfileData2 {
    me {
      id
      username
      firstName
      lastName
      profilePhoto
      accounts {
        id
        name
      }
      appCount
      apps(limit: ${APP_LIMIT}, offset: 0) {
        id
        description
        fullName
        iconUrl
        lastPublishedTime
        name
        packageName
        username
        sdkVersion
        privacy
      }
      snacks(limit: ${SNACK_LIMIT}, offset: 0) {
        name
        description
        fullName
        slug
        isDraft
      }
    }
  }
`;

export default function Profile(props: StackScreenProps<AllStackRoutes, 'Profile'>) {
  const dispatch = useDispatch();
  const query = useQuery<ProfileData, ProfileVars>(ProfileDataQuery, {
    fetchPolicy: 'cache-and-network',
  });
  const { loading, error, data } = query;

  // We verify that the viewer is logged in when we receive data from the server; if the viewer
  // isn't logged in, we clear our locally stored credentials
  React.useEffect(() => {
    if (!loading && !error && !data?.me) {
      dispatch(SessionActions.signOut());
    }
  }, [loading, error, data?.me]);

  return <ProfileView {...props} {...query} />;
}
