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

class ProfileView extends React.Component<
  {
    username: string;
    isAuthenticated: boolean;
  } & StackScreenProps<AllStackRoutes, 'Profile'>,
  { isOwnProfile: boolean | null }
> {
  constructor(props) {
    super(props);

    this.state = {
      // NOTE: An empty username prop means to display the viewer's profile. We use null to
      // indicate we don't yet know if this is the viewer's own profile.
      isOwnProfile: !props.route.params?.username ? true : null,
    };
  }

  componentDidMount() {
    if (this.state.isOwnProfile !== null) {
      return;
    }

    if (!this.props.isAuthenticated) {
      // NOTE: this logic likely can be moved to the constructor or should be in a hook that runs
      // whenever the prop is updated
      this.setState({ isOwnProfile: false });
    } else {
      getViewerUsernameAsync().then(
        username => {
          this.setState({ isOwnProfile: username === this.props.username });
        },
        error => {
          this.setState({ isOwnProfile: false });
          console.warn(`There was an error fetching the viewer's username`, error);
        }
      );
    }
  }

  render() {
    if (this.state.isOwnProfile === null) {
      return <View style={styles.loadingContainer} />;
    } else if (!this.props.isAuthenticated && this.state.isOwnProfile) {
      return <ProfileUnauthenticated />;
    } else if (this.state.isOwnProfile) {
      return <MyProfile {...this.props} isOwnProfile={this.state.isOwnProfile} />;
    }

    return <OtherProfile {...this.props} isOwnProfile={this.state.isOwnProfile} />;
  }
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
