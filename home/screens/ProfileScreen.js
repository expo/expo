/* @flow */
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  findNodeHandle,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';

import OptionsButton from '../components/OptionsButton';
import ProfileUnauthenticated from '../components/ProfileUnauthenticated';
import MyProfileContainer from '../containers/MyProfileContainer';
import OtherProfileContainer from '../containers/OtherProfileContainer';
import SessionActions from '../redux/SessionActions';
import getViewerUsernameAsync from '../utils/getViewerUsernameAsync';
import isUserAuthenticated from '../utils/isUserAuthenticated';
import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';

@connect((data, props) => ProfileScreen.getDataProps(data, props))
export default class ProfileScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('username', 'Profile'),
    headerRight: navigation.getParam('username') ? (
      <OptionsButton />
    ) : (
      Platform.select({ ios: <UserSettingsButtonIOS />, default: <SignOutButtonAndroid /> })
    ),
  });

  static getDataProps(data, props) {
    let isAuthenticated = isUserAuthenticated(data.session);

    return {
      isAuthenticated,
      username: props.navigation.getParam('username'),
    };
  }

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
    } else {
      return <OtherProfileContainer {...this.props} isOwnProfile={this.state.isOwnProfile} />;
    }
  }
}

@onlyIfAuthenticated
@connect()
class SignOutButtonAndroid extends React.Component {
  _anchor: View;

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View
          collapsable={false}
          ref={view => {
            this._anchor = view;
          }}
          style={{ position: 'absolute', top: 5, left: 0 }}
        />
        <TouchableOpacity style={styles.buttonContainer} onPress={this._handlePress}>
          <MaterialIcons name="more-vert" size={27} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  _handlePress = () => {
    let handle = findNodeHandle(this._anchor);
    NativeModules.UIManager.showPopupMenu(
      handle,
      ['Sign out'],
      () => {},
      (action, selectedIndex) => {
        if (selectedIndex === 0) {
          this.props.dispatch(SessionActions.signOut());
        }
      }
    );
  };
}

@onlyIfAuthenticated
@withNavigation
class UserSettingsButtonIOS extends React.Component {
  render() {
    return (
      <TouchableOpacity style={styles.buttonContainer} onPress={this._handlePress}>
        <Text style={{ fontSize: 17, color: '#037aff' }}>Options</Text>
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    this.props.navigation.navigate('UserSettings');
  };
}

@onlyIfAuthenticated
@connect()
class SignOutButtonIOS extends React.Component {
  render() {
    return (
      <TouchableOpacity style={styles.buttonContainer} onPress={this._handlePress}>
        <Text style={{ fontSize: 16, color: '#4E9BDE' }}>Sign Out</Text>
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    this.props.dispatch(SessionActions.signOut());
  };
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
