import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import Account from '../containers/Account';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';

export default function AccountScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Account'>) {
  const {
    isAuthenticated,
    accountName,
  }: { isAuthenticated: boolean; accountName?: string } = useSelector(
    React.useCallback(
      data => {
        const isAuthenticated = isUserAuthenticated(data.session);
        return {
          isAuthenticated,
          accountName: props.route.params?.accountName,
        };
      },
      [props.route]
    )
  );

  return (
    <AccountView
      {...props}
      isAuthenticated={isAuthenticated}
      accountName={accountName}
      navigation={navigation}
    />
  );
}

function AccountView(
  props: {
    accountName?: string;
    isAuthenticated: boolean;
  } & StackScreenProps<AllStackRoutes, 'Account'>
) {
  // undefined means not yet computed, show loading screen
  const [viewerUsername, setViewerUsername] = React.useState<string | null | undefined>(null);

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

  return (
    <Account
      {...props}
      accountName={props.accountName ?? viewerUsername}
      isCurrentUsersPersonalAccount={viewerUsername === props.accountName}
    />
  );
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
