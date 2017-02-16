/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationStyles } from '@exponent/ex-navigation';

import { debounce } from 'lodash';

import SearchBar from '../components/SearchBar';
import SearchResultsContainer from '../containers/SearchResultsContainer';

export default class SearchScreen extends React.Component {
  static route = {
    styles: NavigationStyles.NoAnimation,
    navigationBar: {
      renderTitle: ({ config: { eventEmitter } }) => {
        return <SearchBar emitter={eventEmitter} />;
      },
      ...Platform.select({
        ios: {
          height: 70,
          renderLeft: () => null,
        },
      }),
    },
  };

  state = {
    text: '',
  };

  componentWillMount() {
    const emitter = this.props.route.getEventEmitter();
    this._searchSubscription = emitter.addListener(
      'change',
      debounce(this._handleChangeQuery, 200),
    );
  }

  _handleChangeQuery = text => {
    this.setState({ text });
  };

  componentWillUnmount() {
    this._searchSubscription.remove();
  }

  render() {
    return (
      <View style={styles.container}>
        <SearchResultsContainer query={this.state.text} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
