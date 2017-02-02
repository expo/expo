/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule HomeUrlBar
 */
'use strict';

import AppleEasing from 'react-apple-easing';
import React, { PropTypes } from 'react';
import {
  ActivityIndicatorIOS,
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ResponsiveImage from '@exponent/react-native-responsive-image';

import autobind from 'autobind-decorator';

export default class HomeUrlBar extends React.Component {
  static propTypes = {
    onRefresh: PropTypes.func,
    onSubmit: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      typedUrl: '',
      isEditing: false,
      cancelButtonWidth: new Animated.Value(0),
    };
  }

  render() {
    let { isEditing, typedUrl } = this.state;
    let cancelButtonStrut = {
      width: this.state.cancelButtonWidth,
    };

    return (
      <View style={[styles.urlBar, this.props.style]}>
        <View style={styles.urlInputContainer}>
          <TextInput
            ref={component => { this._urlInput = component; }}
            keyboardType="url"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="go"
            enablesReturnKeyAutomatically
            clearButtonMode="never"
            placeholder="Go to an Exponent link…"
            value={isEditing ? typedUrl : this.props.url}
            onFocus={this._beginEditing}
            onBlur={this._endEditing}
            onChangeText={this._handleUrlTextChange}
            onSubmitEditing={this._handleSubmitEditing}
            style={styles.urlInput}
          />
        {this._renderRefreshComponent()}
        </View>
        <TouchableOpacity
          onPress={this._cancelEditingUrl}
          style={styles.cancelButton}>
          <Animated.View style={cancelButtonStrut} />
          <Text
            onLayout={this._handleCancelButtonLayout}
            style={styles.cancelButtonText}
            numberOfLines={1}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  _renderRefreshComponent() {
    if (this.props.loading) {
      return <ActivityIndicatorIOS animating />;
    }
    return (
      <TouchableOpacity onPress={this._refresh} style={styles.refreshButton}>
        <ResponsiveImage
          sources={{
            2: { uri: 'http://static.exponentjs.com/NavigationBarRefresh@2x.png' },
            3: { uri: 'http://static.exponentjs.com/NavigationBarRefresh@3x.png' },
          }}
          style={styles.refreshIcon}
        />
      </TouchableOpacity>
    );
  }

  @autobind
  _handleCancelButtonLayout(event) {
    let { width } = event.nativeEvent.layout;
    this._cancelButtonWidth = width;
  }

  @autobind
  _beginEditing(event) {
    this.setState({
      isEditing: true,
      typedUrl: this.props.url,
    });
    this._animateCancelButton(this._cancelButtonWidth);
  }

  @autobind
  _endEditing(event) {
    this.setState({ isEditing: false });
    this._animateCancelButton(0);
  }

  _animateCancelButton(width) {
    if (this._cancelButtonAnimation) {
      this._cancelButtonAnimation.stop();
    }

    this._cancelButtonAnimation = Animated.timing(this.state.cancelButtonWidth, {
      toValue: width,
      easing: AppleEasing.default,
      duration: 250,
    });
    this._cancelButtonAnimation.start();
  }

  @autobind
  _handleUrlTextChange(text) {
    this.setState({ typedUrl: text });
  }

  @autobind
  _cancelEditingUrl() {
    this._urlInput.blur();
  }

  @autobind
  _handleSubmitEditing(event) {
    if (this.props.onSubmit) {
      this.props.onSubmit(event);
    }

    let url = event.nativeEvent.text;
    if (url !== this.state.typedUrl) {
      this.setState({ typedUrl: url });
    }
  }

  @autobind
  _refresh() {
    if (this.props.onRefresh) {
      this.props.onRefresh();
    }
  }
}

let styles = StyleSheet.create({
  urlBar: {
    flexDirection: 'row',
  },
  urlInputContainer: {
    flex: 1,
    paddingHorizontal: 9,
    backgroundColor: '#fff',
    flexDirection: 'row',
  },
  urlInput: {
    fontSize: 17,
    height: 36,
    flex: 1,
    color: '#595c68',
  },
  cancelButton: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cancelButtonText: {
    position: 'absolute',
    color: '#0853b7',
    fontSize: 15,
    paddingTop: 8.5,
    paddingLeft: 0,
    paddingRight: 11,
  },
  refreshButton: {
    backgroundColor: 'transparent',
    marginLeft: -15,
    marginRight: -15,
    paddingVertical: 7,
    paddingLeft: 20,
    paddingRight: 15,
  },
  refreshIcon: {
    width: 16,
    height: 20,
    tintColor: '#0853b7',
  },
});
