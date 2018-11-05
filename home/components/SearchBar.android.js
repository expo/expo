/* @flow */

import React from 'react';
import { NativeModules, StyleSheet, TextInput, View } from 'react-native';
import { HeaderBackButton, withNavigation, withNavigationFocus } from 'react-navigation';

import Colors from '../constants/Colors';

const { ExponentKernel } = NativeModules;

@withNavigation
@withNavigationFocus
export default class SearchBar extends React.Component {
  componentDidMount() {
    requestAnimationFrame(() => {
      this._textInput.focus();
    });
  }

  state = {
    text: '',
  };

  componentDidUpdate(prevProps) {
    if (!prevProps.isFocused && this.props.isFocused) {
      this._textInput && this._textInput.focus();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <HeaderBackButton onPress={() => this.props.navigation.goBack()} />
        <TextInput
          ref={view => {
            this._textInput = view;
          }}
          placeholder="Find a project or enter a URL..."
          placeholderStyle={styles.sear}
          value={this.state.text}
          autoCapitalize="none"
          autoCorrect={false}
          underlineColorAndroid={Colors.tintColor}
          onSubmitEditing={this._handleSubmit}
          onChangeText={this._handleChangeText}
          style={styles.searchInput}
        />
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
  searchInputPlaceholderText: {},
});
