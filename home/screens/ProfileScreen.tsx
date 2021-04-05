import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import Profile from '../containers/Profile';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';

export default function ProfileScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Profile'>) {
  const { isAuthenticated }: { isAuthenticated: boolean } = useSelector(
    React.useCallback(
      data => {
        const isAuthenticated = isUserAuthenticated(data.session);
        return {
          isAuthenticated,
        };
      },
      [props.route]
    )
  );

  return <ProfileView {...props} isAuthenticated={isAuthenticated} navigation={navigation} />;
}

function ProfileView(
  props: {
    isAuthenticated: boolean;
  } & StackScreenProps<AllStackRoutes, 'Profile'>
) {
  // undefined means not yet computed, show loading screen
  const [viewerUsername, setViewerUsername] = React.useState<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (!props.isAuthenticated) {
      setViewerUsername(null);
    } else {
      getViewerUsernameAsync().then(
        viewerUsername => {
          setViewerUsername(viewerUsername);
        },
        error => {
          setViewerUsername(null);
          console.warn(`There was an error fetching the viewer's username`, error);
        }
      );
    }
  }, [props.isAuthenticated]);

  if (viewerUsername === undefined) {
    return <View style={styles.loadingContainer} />;
  }

  if (!props.isAuthenticated || !viewerUsername) {
    return <ProfileUnauthenticated />;
  }

  return <Profile {...props} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
});
