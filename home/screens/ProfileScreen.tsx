import * as React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationInjectedProps, withNavigation } from 'react-navigation';
import { useDispatch, useSelector } from 'react-redux';

import { Ionicons } from '../components/Icons';
import OptionsButton from '../components/OptionsButton';
import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import Colors from '../constants/Colors';
import MyProfileContainer from '../containers/MyProfileContainer';
import OtherProfileContainer from '../containers/OtherProfileContainer';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';
import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';

export default function ProfileScreen({ navigation, ...props }: NavigationInjectedProps) {
  // TODO(Bacon): This might not be needed, check during TS migration.
  const dispatch = useDispatch();
  const { isAuthenticated, username } = useSelector(
    React.useCallback(
      data => {
        const isAuthenticated = isUserAuthenticated(data.session);
        return {
          isAuthenticated,
          username: navigation.getParam('username'),
        };
      },
      [navigation]
    )
  );

  return (
    <ProfileView
      {...props}
      dispatch={dispatch}
      isAuthenticated={isAuthenticated}
      username={username}
      navigation={navigation}
    />
  );
}

ProfileScreen.navigationOptions = ({ navigation, theme }) => {
  return {
    title: navigation.getParam('username', 'Profile'),
    headerRight: () =>
      navigation.getParam('username') ? (
        <OptionsButton />
      ) : (
        <ConnectedUserSettingsButton theme={theme} />
      ),
  };
};

class ProfileView extends React.Component<
  {
    username: string;
    dispatch: (action: any) => void;
    isAuthenticated: boolean;
  } & NavigationInjectedProps,
  { isOwnProfile: boolean }
> {
  constructor(props) {
    super(props);

    this.state = {
      // NOTE: An empty username prop means to display the viewer's profile. We use null to
      // indicate we don't yet know if this is the viewer's own profile.
      isOwnProfile: !props.navigation.getParam('username') ? true : null,
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
      return <MyProfileContainer {...this.props} isOwnProfile={this.state.isOwnProfile} />;
    }

    return <OtherProfileContainer {...this.props} isOwnProfile={this.state.isOwnProfile} />;
  }
}

function UserSettingsButton(props: { theme: string } & NavigationInjectedProps) {
  const onPress = () => {
    props.navigation.navigate('UserSettings');
  };

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      {Platform.select({
        ios: <Text style={{ fontSize: 17, color: Colors[props.theme].tintColor }}>Options</Text>,
        android: (
          <Ionicons
            name="md-settings"
            size={27}
            lightColor={Colors.light.text}
            darkColor={Colors.dark.text}
          />
        ),
      })}
    </TouchableOpacity>
  );
}

const ConnectedUserSettingsButton = onlyIfAuthenticated(withNavigation(UserSettingsButton));

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
