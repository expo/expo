/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ShortcutButton
 * @flow weak
 */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import ExColors from 'ExColors';
const { ExponentKernel } = NativeModules;

export default class ShortcutButton extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
    manifest: PropTypes.object.isRequired,
    style: PropTypes.any,
  };

  _onPress = () => {
    let { url, manifest } = this.props;
    ExponentKernel.createShortcutAsync(url, manifest);
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this._onPress}
        style={[styles.container, this.props.style]}>
        <Text style={styles.text}>
          Add Shortcut
        </Text>
      </TouchableOpacity>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: ExColors.shortcut,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    marginHorizontal: 20,
  },
});
