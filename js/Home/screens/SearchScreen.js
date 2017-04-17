/* @flow */

import Expo from 'expo';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationStyles } from '@expo/ex-navigation';

import gql from 'graphql-tag';
import { groupBy, debounce } from 'lodash';
import { graphql } from 'react-apollo';

import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';

const ResultsLimit = 10;
const SearchQuery = gql`
  query Search($offset: Int!, $limit: Int!, $query: String!) {
    searchUsersAndApps(type: ALL, query: $query, offset: $offset, limit: $limit) {
      __typename
      ... on BaseSearchResult {
        id
        rank
      }
      ... on AppSearchResult {
        app {
          id
          fullName
          name
          description
          packageUsername
          iconUrl
          likeCount
          isLikedByMe
        }
      }
      ... on UserSearchResult {
        user {
          id
          fullName
          username
          appCount
          profilePhoto
          isLegacy
        }
      }
    }
  }
`;

@graphql(SearchQuery, {
  props: props => {
    let { data } = props;

    let results = groupBy(data.searchUsersAndApps, result => result.__typename);

    return {
      ...props,
      data: {
        ...data,
        results,
      },
    };
  },
  options: props => ({
    variables: {
      offset: 0,
      limit: props.limit,
      query: props.query || '',
    },
    fetchPolicy: 'cache-and-network',
  }),
})
export default class SearchScreen extends React.Component {
  static route = {
    styles: NavigationStyles.NoAnimation,
    navigationBar: Platform.select({
      ios: {
        // We render the seach bar within the SearchScreen so we
        // get more pleasant transitions since it is taller than other
        // screen navigation bars
        visible: false,
      },
      android: {
        renderTitle: ({ config: { eventEmitter } }) => {
          return <SearchBar emitter={eventEmitter} />;
        },
      },
    }),
  };

  state = {
    text: '',
  };

  _searchSubscription: any;

  componentWillMount() {
    const emitter = this.props.route.getEventEmitter();
    this._searchSubscription = emitter.addListener(
      'change',
      debounce(this._handleChangeQuery, 16.6 * 2)
    );
  }

  _handleChangeQuery = (text: string) => {
    this.props.navigator.updateCurrentRouteParams({
      query: text,
      limit: text.length > 0 ? ResultsLimit : 0,
    });
  };

  componentWillUnmount() {
    this._searchSubscription.remove();
  }

  render() {
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' &&
          <View style={styles.iosSearchBarContainer}>
            <SearchBar emitter={this.props.route.getEventEmitter()} />
          </View>}

        <SearchResults
          query={this.props.data.variables.query}
          data={this.props.data}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iosSearchBarContainer: {
    height: 70,
    paddingTop: Expo.Constants.statusBarHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(46, 59, 76, 0.10)',
  },
});
