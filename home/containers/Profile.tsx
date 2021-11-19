import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import ProfileView from '../components/ProfileView';
import { useHome_ProfileData2Query } from '../graphql/types';
import { AllStackRoutes } from '../navigation/Navigation.types';
import { useDispatch } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';

const APP_LIMIT = 3;
const SNACK_LIMIT = 3;

export default function Profile(props: StackScreenProps<AllStackRoutes, 'Profile'>) {
  const dispatch = useDispatch();
  const query = useHome_ProfileData2Query({
    fetchPolicy: 'cache-and-network',
    variables: {
      appLimit: APP_LIMIT,
      snackLimit: SNACK_LIMIT,
    },
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
