/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule MenuView
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
    let iconUrl = this.props.task.manifest.get('iconUrl');
    let iconStyles = (iconUrl) ? [styles.taskIcon, {backgroundColor: 'transparent'}] : styles.taskIcon;
    return (
      <View style={styles.container}
        onStartShouldSetResponder={() => true}
        onResponderGrant={this._onPressContainer}>
        <View style={styles.overlay}>
          <View style={styles.taskMetaRow}>
            <View style={styles.taskIconColumn}>
              <Image source={{uri: iconUrl}} style={iconStyles} />
            </View>
            <View style={styles.taskInfoColumn}>
              <Text style={styles.taskName}>{this.props.task.manifest.get('name')}</Text>
              <Text style={styles.taskUrl}>{taskUrl}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.buttonContainer}>
            {this._renderButton('Reload', Browser.refresh)}
            {this._renderButton('Go To Exponent Home', this._goToHome)}
          </View>
        </View>
      </View>
    );
  }

  _renderButton(text, onPress) {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}>
        <Text style={styles.buttonText}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  @autobind
  _onPressContainer() {
    ExStore.dispatch(BrowserActions.showMenuAsync(false));
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
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginHorizontal: 16,
  },
  taskMetaRow: {
    flexDirection: 'row',
  },
  taskInfoColumn: {
    flex: 4,
  },
  taskIconColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskName: {
    color: '#595c68',
    backgroundColor: 'transparent',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 16,
    marginRight: 16,
    marginBottom: 2,
  },
  taskUrl: {
    color: '#9ca0a6',
    backgroundColor: 'transparent',
    marginRight: 16,
    marginVertical: 4,
    fontSize: 14,
  },
  taskIcon: {
    width: 52,
    height: 52,
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#c5c6c7',
  },
  separator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: '#c5c6c7',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  buttonContainer: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: 'transparent',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#4596e1',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  buttonText: {
    color: '#056ecf',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '700',
  },
});
