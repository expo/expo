import React from 'react';
import { StyleSheet, View } from 'react-native';

import DevMenuContext, { Context } from '../DevMenuContext';
import Profile from '../components/profile/Profile';
import ProfileUnauthenticated from '../components/profile/UnauthenticatedProfile';

export default class DevMenuMainScreen extends React.PureComponent {
  static navigationOptions = {
    headerShown: true,
  };

  static contextType = DevMenuContext;

  context: Context;

  render() {
    const { isAuthenticated } = this.context;

    if (!isAuthenticated) {
      return (
        <View testID="DevMenuProfileScreen" style={styles.container}>
          <ProfileUnauthenticated />
        </View>
      );
    }

    return (
      <View testID="DevMenuProfileScreen" style={styles.container}>
        <Profile />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    minHeight: 150,
    padding: 10,
  },
});
