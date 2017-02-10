import React from 'react';
import {
  LayoutAnimation,
  Linking,
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
import ExUrls from 'ExUrls';
import Layout from '../constants/Layout';

@withNavigation
export default class SearchBar extends React.Component {
  componentDidMount() {
    requestAnimationFrame(() => {
      this._textInput.focus();
    });
  }

  state = {
    text: '',
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          ref={view => { this._textInput = view; }}
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

  _handleChangeText = (text) => {
    this.setState({text});
    this.props.emitter.emit('change', text);
  }

  _handleSubmit = () => {
    let url = ExUrls.normalizeUrl(this.state.text);
    Linking.openURL(url);
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
