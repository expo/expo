import React from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SlidingTabNavigation,
  SlidingTabNavigationItem,
  NavigationBar,
  withNavigation,
} from '@exponent/ex-navigation';
import {
  Ionicons,
} from '@exponent/vector-icons';
import TouchableNativeFeedback from '@exponent/react-native-touchable-native-feedback-safe';

import Colors from '../constants/Colors';
import SearchBar from '../components/SearchBar';
import StyledSlidingTabNavigation from '../navigation/StyledSlidingTabNavigation';
import ExploreTabContainer from '../containers/ExploreTabContainer';

const TabTitles = {
  'top': 'Top projects',
  'new': 'New projects',
  'featured': 'Featured',
}

@withNavigation
class SearchButton extends React.Component {
  render() {
    return (
      <TouchableNativeFeedback
        onPress={this._handlePress}
        style={{flex: 1, paddingLeft: 20, paddingRight: 20, alignItems: 'center', justifyContent: 'center'}}>
        <Ionicons name="md-search" size={27} color="#4E9BDE" />
      </TouchableNativeFeedback>
    );
  }

  _handlePress = () => {
    this.props.navigator.push('search');
  }
}

export default class ExploreScreen extends React.Component {
  static route = {
    navigationBar: {
      // Disable the built-in navigation bar for better transitions
      visible: false,
    }
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: Colors.greyBackground}}>
        {this._renderSearchBar()}
        <StyledSlidingTabNavigation
          tabBarStyle={Platform.OS === 'android' && styles.tabBarAndroid}
          initialTab="featured"
          keyToTitle={TabTitles}>
          <SlidingTabNavigationItem id="featured">
            <ExploreTabContainer
              filter="FEATURED"
              onPressUsername={this._handlePressUsername}
            />
          </SlidingTabNavigationItem>

          <SlidingTabNavigationItem id="top">
            <ExploreTabContainer
              filter="TOP"
              onPressUsername={this._handlePressUsername}
            />
          </SlidingTabNavigationItem>

          <SlidingTabNavigationItem id="new">
            <ExploreTabContainer
              filter="NEW"
              onPressUsername={this._handlePressUsername}
            />
          </SlidingTabNavigationItem>
        </StyledSlidingTabNavigation>
      </View>
    );
  }

  _renderSearchBar() {
    if (Platform.OS === 'android') {
      return (
        <View style={styles.titleBarAndroid}>
          <View style={styles.titleAndroid}>
            <Text numberOfLines={1} style={styles.titleTextAndroid}>
              Projects
            </Text>
          </View>

          <View style={styles.rightButtonAndroid}>
            <SearchButton />
          </View>
        </View>
      );
    } else {
      return (
        <View style={{height: 70, backgroundColor: '#fff', paddingTop: 20}}>
          <SearchBar.PlaceholderButton />
        </View>
      );
    }
  }

  _handlePressUsername = (username) => {
    this.props.navigator.push('profile', { username });
  }
}

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
    // borderTopWidth: StyleSheet.hairlineWidth * 2,
    // marginTop: 1,
  },
  titleBarAndroid: {
    height: 79,
    backgroundColor: '#fff',
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
