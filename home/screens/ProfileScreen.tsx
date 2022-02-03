import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import Colors from '../constants/Colors';
import Profile from '../containers/Profile';
import { AllStackRoutes } from '../navigation/Navigation.types';
import { useSelector } from '../redux/Hooks';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';

export default function ProfileScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Profile'>) {
  const { isAuthenticated } = useSelector(
    React.useCallback(
      (data) => {
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
        (viewerUsername) => {
          setViewerUsername(viewerUsername);
        },
        (error) => {
          setViewerUsername(null);
          console.warn(`There was an error fetching the viewer's username`, error);
        }
      );
    }
  }, [props.isAuthenticated]);

  if (viewerUsername === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
    );
  }

  if (!props.isAuthenticated || !viewerUsername) {
    return <ProfileUnauthenticated />;
  }

  return <Profile {...props} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
  },
});
