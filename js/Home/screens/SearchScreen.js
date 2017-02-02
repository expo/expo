import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  NavigationStyles,
} from '@exponent/ex-navigation';

import SearchBar from '../components/SearchBar';

export default class SearchScreen extends React.Component {
  static route = {
    styles: NavigationStyles.NoAnimation,
    navigationBar: {
      ...Platform.select({
        ios: {
          height: 70,
          renderLeft: () => null,
          renderTitle: () => <SearchBar />,
        },
        android: {
          renderTitle: () => <SearchBar />,
        },
      }),
    }
  }

  render() {
    return (
      <View style={styles.container}>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
