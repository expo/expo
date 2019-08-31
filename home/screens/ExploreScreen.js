/* @flow */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { withNavigation } from 'react-navigation';
import TouchableNativeFeedback from '@expo/react-native-touchable-native-feedback-safe';
import { connect } from 'react-redux';

import Colors from '../constants/Colors';
import SearchBar from '../components/SearchBar';
import ExploreTabContainer from '../containers/ExploreTabContainer';
import FeatureFlags from '../FeatureFlags';
import isUserAuthenticated from '../utils/isUserAuthenticated';
import isIPhoneX from '../utils/isIPhoneX';
import { StyledView } from '../components/Views';
import { StyledText } from '../components/Text';
import { Ionicons } from '../components/Icons';

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
        background={TouchableNativeFeedback.Ripple('#eee', true)}
        style={{
          flex: 1,
          paddingLeft: 20,
          paddingRight: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="md-search" size={27} lightColor={Colors.light.text} />
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
      <StyledView
        style={{ flex: 1 }}
        darkBackgroundColor="#000"
        lightBackgroundColor={Colors.light.greyBackground}>
        {this._renderSearchBar()}
        {this._renderContent()}
      </StyledView>
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
        <StyledView style={styles.titleBarAndroid} darkBackgroundColor="#000">
          <View style={styles.titleAndroid}>
            <StyledText numberOfLines={1} style={styles.titleTextAndroid}>
              {FeatureFlags.HIDE_EXPLORE_TABS ? 'Featured Projects' : 'Explore'}
            </StyledText>
          </View>

          <View style={styles.rightButtonAndroid}>
            <SearchButton />
          </View>
        </StyledView>
      );
    } else {
      return (
        <StyledView style={styles.titleBarIOS} darkBackgroundColor="#000">
          <SearchBar.PlaceholderButton />
        </StyledView>
      );
    }
  }

  _handlePressUsername = (username: string) => {
    this.props.navigation.push('Profile', { username });
  };
}

const NOTCH_HEIGHT = isIPhoneX ? 20 : 0;

const styles = StyleSheet.create({
  titleBarIOS: {
    height: 70 + NOTCH_HEIGHT,
    paddingTop: 20 + NOTCH_HEIGHT,
  },
  titleBarAndroid: {
    height: 79,
    paddingTop: 26,
    marginBottom: 0,
  },
  titleAndroid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleTextAndroid: {
    flex: 1,
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
