import React from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Ionicons,
} from '@exponent/vector-icons';
import {
  NavigationBar,
  withNavigation,
} from '@exponent/ex-navigation';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

@withNavigation
export default class SearchBar extends React.Component {
  componentDidMount() {
    requestAnimationFrame(() => {
      this._textInput.focus();
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          ref={view => { this._textInput = view; }}
          placeholder="Find a project..."
          placeholderStyle={styles.sear}
          underlineColorAndroid={Colors.tintColor}
          style={styles.searchInput}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    marginBottom: 2,
    paddingLeft: 5,
    marginRight: 5,
  },
  searchInputPlaceholderText: {
  },
});
