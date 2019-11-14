/* @flow */

import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme, ThemeContext, withNavigation, withNavigationFocus } from 'react-navigation';

import { HeaderBackButton } from 'react-navigation-stack';

import Colors from '../constants/Colors';
import * as Kernel from '../kernel/Kernel';

function StyledBackButton(props) {
  let theme = useTheme();

  return <HeaderBackButton tintColor={Colors[theme].text} {...props} />;
}

@withNavigation
@withNavigationFocus
export default class SearchBar extends React.Component {
  static contextType = ThemeContext;
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
        <StyledBackButton onPress={() => this.props.navigation.goBack()} />
        {/* TODO: dark mode */}
        <TextInput
          ref={view => {
            this._textInput = view;
          }}
          placeholder="Find a project or enter a URL..."
          value={this.state.text}
          autoCapitalize="none"
          autoCorrect={false}
          underlineColorAndroid={Colors[this.context].tintColor}
          onSubmitEditing={this._handleSubmit}
          onChangeText={this._handleChangeText}
          placeholderTextColor={this.context === 'light' ? '#ccc' : '#eee'}
          style={[styles.searchInput, { color: this.context === 'light' ? '#000' : '#fff' }]}
        />
      </View>
    );
  }

  _handleChangeText = text => {
    this.setState({ text });
    this.props.emitter && this.props.emitter.emit('change', text);
  };

  _handleSubmit = () => {
    this._textInput.blur();
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
