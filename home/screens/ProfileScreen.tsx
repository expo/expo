import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import { OtherProfile, MyProfile } from '../containers/Profile';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';

export default function ProfileScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Profile'>) {
  const { isAuthenticated, username } = useSelector(
    React.useCallback(
      data => {
        const isAuthenticated = isUserAuthenticated(data.session);
        return {
          isAuthenticated,
          username: props.route.params?.username,
        };
      },
      [props.route]
    )
  );

  return (
    <ProfileView
      {...props}
      isAuthenticated={isAuthenticated}
      username={username}
      navigation={navigation}
    />
  );
}

function ProfileView(
  props: {
    username: string;
    isAuthenticated: boolean;
  } & StackScreenProps<AllStackRoutes, 'Profile'>
) {
  // NOTE: An empty username prop means to display the viewer's profile. We use null to
  // indicate we don't yet know if this is the viewer's own profile.
  const [isOwnProfile, setIsOwnProfile] = React.useState(
    !props.route.params?.username ? true : null
  );

  React.useEffect(() => {
    if (isOwnProfile !== null) {
      return;
    }

    if (!props.isAuthenticated) {
      // NOTE: this logic likely should be moved to a hook that runs whenever
      // the prop is updated
      setIsOwnProfile(false);
    } else {
      getViewerUsernameAsync().then(
        username => {
          setIsOwnProfile(username === props.username);
        },
        error => {
          setIsOwnProfile(false);
          console.warn(`There was an error fetching the viewer's username`, error);
        }
      );
    }
  }, []);

  if (isOwnProfile === null) {
    return <View style={styles.loadingContainer} />;
  } else if (!props.isAuthenticated && isOwnProfile) {
    return <ProfileUnauthenticated />;
  } else if (isOwnProfile) {
    return <MyProfile {...props} isOwnProfile={isOwnProfile} />;
  }

  return <OtherProfile {...props} isOwnProfile={isOwnProfile} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
