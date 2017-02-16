import React from 'react';
import {
  LayoutAnimation,
  Linking,
  NativeModules,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@exponent/vector-icons';
import { withNavigation } from '@exponent/ex-navigation';

import Layout from '../constants/Layout';

const { ExponentKernel } = NativeModules;

const SearchContainerHorizontalMargin = 10;
const SearchContainerWidth = Layout.window.width - SearchContainerHorizontalMargin * 2;

const SearchIcon = () => (
  <View style={styles.searchIconContainer}>
    <Ionicons name="ios-search" size={18} color="#ccc" />
  </View>
);

@withNavigation class PlaceholderButtonSearchBar extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={this._handlePress}>
          <View style={styles.searchContainer}>
            <TextInput
              editable={false}
              placeholder="Find a project or enter a URL..."
              placeholderStyle={styles.searchInputPlaceholderText}
              style={styles.searchInput}
            />

            <SearchIcon />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  _handlePress = () => {
    this.props.navigator.push('search');
  };
}

@withNavigation
export default class SearchBar extends React.Component {
  static PlaceholderButton = PlaceholderButtonSearchBar;

  state = {
    text: '',
    showCancelButton: false,
    inputWidth: Layout.window.width,
  };

  componentDidMount() {
    requestAnimationFrame(() => {
      this._textInput.focus();
    });
  }

  _handleLayoutCancelButton = e => {
    if (this.state.showCancelButton) {
      return;
    }

    const cancelButtonWidth = e.nativeEvent.layout.width;

    requestAnimationFrame(() => {
      LayoutAnimation.configureNext({
        duration: 200,
        create: {
          type: LayoutAnimation.Types.linear,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.9,
          initialVelocity: 10,
        },
      });

      this.setState({
        showCancelButton: true,
        inputWidth: SearchContainerWidth - cancelButtonWidth,
      });
    });
  };

  render() {
    let { inputWidth, showCancelButton } = this.state;

    return (
      <View style={styles.container}>
        <View style={[styles.searchContainer, { width: inputWidth }]}>
          <TextInput
            ref={view => {
              this._textInput = view;
            }}
            clearButtonMode="while-editing"
            onChangeText={this._handleChangeText}
            value={this.state.text}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            placeholder="Find a project or enter a URL..."
            placeholderStyle={styles.searchInputPlaceholderText}
            onSubmitEditing={this._handleSubmit}
            style={styles.searchInput}
          />

          <SearchIcon />
        </View>

        <View
          key={showCancelButton ? 'visible-cancel-button' : 'layout-only-cancel-button'}
          style={[styles.buttonContainer, { opacity: showCancelButton ? 1 : 0 }]}>
          <TouchableOpacity
            style={styles.button}
            onLayout={this._handleLayoutCancelButton}
            onPress={this._handlePressCancelButton}>
            <Text style={{ fontSize: 16, color: '#4E9BDE' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  _handleChangeText = text => {
    this.setState({ text });
    this.props.emitter && this.props.emitter.emit('change', text);
  };

  _handleSubmit = () => {
    let { text } = this.state;
    if (ExponentKernel && (text.toLowerCase() === '^dev menu' || text.toLowerCase() === '^dm')) {
      ExponentKernel.addDevMenu();
    } else {
      this._textInput.blur();
    }
  };

  _handlePressCancelButton = () => {
    this.props.navigator.pop();
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  buttonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingRight: 17,
    paddingLeft: 2,
  },
  searchContainer: {
    height: 30,
    width: SearchContainerWidth,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    marginHorizontal: SearchContainerHorizontalMargin,
    marginTop: 10,
    paddingLeft: 27,
  },
  searchIconContainer: {
    position: 'absolute',
    left: 7,
    top: 6,
    bottom: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingTop: 1,
  },
  searchInputPlaceholderText: {},
});
