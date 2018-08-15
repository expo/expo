/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { withNavigation } from 'react-navigation';
import { Ionicons } from '@expo/vector-icons';
import TouchableNativeFeedback from '@expo/react-native-touchable-native-feedback-safe';
import { connect } from 'react-redux';

import Colors from '../constants/Colors';
import SearchBar from '../components/SearchBar';
import ExploreTabContainer from '../containers/ExploreTabContainer';
import FeatureFlags from '../FeatureFlags';
import isUserAuthenticated from '../utils/isUserAuthenticated';
import isIPhoneX from '../utils/isIPhoneX';

let TabTitles: Object = {
  new: 'New projects',
  featured: 'Featured',
};

if (FeatureFlags.DISPLAY_EXPERIMENTAL_EXPLORE_TABS) {
  TabTitles.top = 'Top projects';
}

@withNavigation
class SearchButton extends React.Component {
  render() {
    return (
      <TouchableNativeFeedback
        onPress={this._handlePress}
        style={{
          flex: 1,
          paddingLeft: 20,
          paddingRight: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="md-search" size={27} color="#000" />
      </TouchableNativeFeedback>
    );
  }

  _handlePress = () => {
    this.props.navigation.navigate('Search');
  };
}

@connect(data => ExploreScreen.getDataProps(data))
export default class ExploreScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  static getDataProps(data) {
    return {
      isAuthenticated: isUserAuthenticated(data.session),
    };
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.greyBackground }}>
        {this._renderSearchBar()}
        {this._renderContent()}
      </View>
    );
  }

  _renderContent() {
    return (
      <ExploreTabContainer
        filter="FEATURED"
        key={this.props.isAuthenticated ? 'authenticated' : 'guest'}
        onPressUsername={this._handlePressUsername}
      />
    );
  }

  _renderSearchBar() {
    if (Platform.OS === 'android') {
      return (
        <View style={styles.titleBarAndroid}>
          <View style={styles.titleAndroid}>
            <Text numberOfLines={1} style={styles.titleTextAndroid}>
              {FeatureFlags.HIDE_EXPLORE_TABS ? 'Featured Projects' : 'Explore'}
            </Text>
          </View>

          <View style={styles.rightButtonAndroid}>
            <SearchButton />
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.titleBarIOS}>
          <SearchBar.PlaceholderButton />
        </View>
      );
    }
  }

  _handlePressUsername = (username: string) => {
    this.props.navigation.push('Profile', { username });
  };
}

let navBarBorder = {};

if (FeatureFlags.HIDE_EXPLORE_TABS) {
  navBarBorder = {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.navBarBorderBottom,
  };
}

const NOTCH_HEIGHT = isIPhoneX ? 20 : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: Colors.greyBackground,
    borderRightWidth: 1,
    borderRightColor: '#f6f6f6',
  },
  tabBarAndroid: {
    paddingTop: 5,
    paddingBottom: 5,
    // note(brentvatne): B&B design called for a border here but in the
    // app it didn't look as nice as in the design, so we'll see if they
    // feel the same
    // borderTopWidth: StyleSheet.hairlineWidth * 2,
    // marginTop: 1,
  },
  titleBarIOS: {
    height: 70 + NOTCH_HEIGHT,
    backgroundColor: '#fff',
    paddingTop: 20 + NOTCH_HEIGHT,
    ...navBarBorder,
  },
  titleBarAndroid: {
    height: 79,
    backgroundColor: '#fff',
    paddingTop: 26,
    marginBottom: 0,
    ...navBarBorder,
  },
  titleAndroid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleTextAndroid: {
    flex: 1,
    color: 'rgba(0, 0, 0, .9)',
    fontSize: 20,
    textAlign: 'left',
  },
  rightButtonAndroid: {
    position: 'absolute',
    right: 0,
    top: 24,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
