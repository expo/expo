/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserErrorView
 */
'use strict';

import React, { PropTypes } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';

import BrowserActions from 'BrowserActions';
import Button from 'react-native-button';
import ExColors from 'ExColors';
import ExStore from 'ExStore';

export default class BrowserErrorView extends React.Component {
  static propTypes = {
    error: PropTypes.object.isRequired,
    ...ScrollView.propTypes,
  };

  constructor(props, context) {
    super(props, context);
    let isShowingDetails = false;
    if (props.error && props.error.manifest) {
      // if we have a manifest and it has dev=true, go ahead and show details immediately.
      isShowingDetails = props.error.manifest.packagerOpts && props.error.manifest.packagerOpts.dev;
    }
    this.state = {
      isShowingDetails,
    };
  }

  render() {
    let { error, style, onRefresh, ...props } = this.props;

    let detailContent, detailButton;
    if (this.state.isShowingDetails) {
      detailContent = (
        <View style={styles.detailsContainer}>
          <Text style={styles.originalUrl}>{error.originalUrl}</Text>
          <Text style={styles.detail}>{`"${error.message}" (code ${error.code})`}</Text>
        </View>
      );
    } else {
      detailButton = (
        <Button
          onPress={() => this.setState({ isShowingDetails: true })}
          style={styles.detailButton}>
          Show Details
        </Button>
      );
    }

    let message = this._readableMessage(error);
    let actionButtons = [];

    if (error.code !== '404' || this.props.isShell) {
      actionButtons.push(
        <Button onPress={onRefresh} style={styles.button} key="try-again-button">
          Try Again
        </Button>
      );
    }

    if (!this.props.isShell) {
      actionButtons.push(
        <Button onPress={this._goToHome.bind(this)} style={styles.button} key="home-button">
          Go back to Expo Home
        </Button>
      );
    }

    return (
      <ScrollView alwaysBounceVertical={false} {...props} style={[styles.container, style]}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonContainer}>
          {actionButtons}
          {detailButton}
        </View>
        {detailContent}
      </ScrollView>
    );
  }

  _readableMessage(error) {
    if (error.code === '404') {
      if (this.props.isShell) {
        return `There was a problem loading the app.`;
      } else {
        return `No experience found at ${error.originalUrl}.`;
      }
      // TODO: identify this case in the server response
      /* if (error.message.indexOf('compatible with this version') !== -1) {
        return `Looks like your copy of Exponent can't run this experience. Try updating Exponent.`;
      } */
    }
    if (
      (error.originalUrl && error.originalUrl.indexOf('.local') !== -1) ||
      error.originalUrl.indexOf('192.') !== -1
    ) {
      return `There was a problem loading the experience. It looks like you may be using a LAN url. Make sure your device is on the same network as the server or try using a tunnel.`;
    }
    return 'There was a problem loading the experience.';
  }

  _goToHome() {
    ExStore.dispatch(BrowserActions.foregroundHomeAsync());
  }
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: 120,
    paddingBottom: 40,
  },
  message: {
    color: ExColors.grayText,
    fontSize: 17,
    textAlign: 'center',
    alignSelf: 'center',
    marginHorizontal: 40,
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 14,
  },
  detail: {
    color: ExColors.grayText,
    marginHorizontal: 40,
    marginBottom: 8,
  },
  originalUrl: {
    marginHorizontal: 40,
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 12,
    marginHorizontal: 40,
    flexDirection: 'column',
  },
  button: {
    fontSize: 14,
    fontWeight: 'normal',
    padding: 8,
  },
  detailButton: {
    marginTop: 12,
    fontSize: 12,
    color: ExColors.grayText,
  },
});
