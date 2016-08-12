/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule MenuView
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Button from 'react-native-button';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ExColors from 'ExColors';
import FriendlyUrls from 'FriendlyUrls';
import ExStore from 'ExStore';

export default class MenuView extends React.Component {

  static propTypes = {
    task: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
  }

  render() {
    let taskUrl = (this.props.task.manifestUrl) ? FriendlyUrls.toFriendlyString(this.props.task.manifestUrl) : '';
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <Text style={styles.taskName}>{this.props.task.manifest.get('name')}</Text>
          <Text style={styles.taskUrl}>{taskUrl}</Text>
          <View style={styles.buttonContainer}>
            <Button onPress={Browser.refresh} style={styles.button}>
              Reload
            </Button>
            <Button onPress={this._goToHome} style={styles.button}>
              Go To Exponent Home
            </Button>
          </View>
        </View>
      </View>
    );
  }

  @autobind
  _goToHome() {
    ExStore.dispatch(BrowserActions.foregroundHomeAsync());
  }
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: '#ffffff',
    margin: 32,
    borderRadius: 6,
  },
  taskName: {
    color: '#000000',
    backgroundColor: 'transparent',
    fontWeight: '700',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  taskUrl: {
    color: '#cccccc',
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  buttonContainer: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  button: {
    fontSize: 14,
    fontWeight: 'normal',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
});
