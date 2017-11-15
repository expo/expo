/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserErrorView
 */
'use strict';

import React, { PropTypes } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Constants } from 'expo';

import BrowserActions from 'BrowserActions';
import Button from 'react-native-button';
import ExColors from 'ExColors';
import ExStore from 'ExStore';

const IS_SIMULATOR = !Constants.isDevice;

export default class BrowserErrorView extends React.Component {
  static propTypes = {
    error: PropTypes.object.isRequired,
    ...ScrollView.propTypes,
  };

  constructor(props, context) {
    super(props, context);
    let isShowingDetails = IS_SIMULATOR; // If we're in the simulator, we're developing, so show details by default
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
    let { details, message } = this._getErrorDetails(error);

    let detailContent, detailButton;
    if (this.state.isShowingDetails) {
      detailContent = (
        <View style={styles.detailsContainer}>
          <Text style={styles.originalUrl}>{error.originalUrl}</Text>
          {/* If the error is a client loading error (probably from an error starting the JS) */}
          {/* we should show the error message. */}
          {details.errorCode === 'CLIENT_LOADING_ERROR' ? (
            <Text style={styles.detail}>{`Error: ${error.message}`}</Text>
          ) : null}
          <Text style={styles.detail}>{`Error Code: ${details.errorCode}`}</Text>
          {/* If the error is a network error, just show the raw code -- else, show the HTTP status code */}
          <Text style={styles.detail}>{`${details.errorCode === 'NETWORK_ERROR'
            ? 'Code'
            : 'Status Code'}: ${error.code}`}</Text>
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

    let actionButtons = [];

    if (error.code !== '404' || error.code !== '400' || this.props.isShell) {
      // If it's not a 404 or 400 error or it's a shell app, let the user
      // try again as the failure may be intermittent.
      actionButtons.push(
        <Button onPress={onRefresh} style={styles.button} key="try-again-button">
          Try Again
        </Button>
      );
    }

    if (!this.props.isShell) {
      actionButtons.push(
        <Button onPress={this._goToHome} style={styles.button} key="home-button">
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

  _getErrorDetails(error) {
    // Handle both types of loading errors:
    // - A manifest loading error, from EXManifestResource. This will have userInfo and errorCode attached to it.
    // - Some type of client loading error, such as:
    //    - Problem parsing manifest (even if server returned 200...this could be some server issue)
    //    - Problem downloading the bundle
    //    - Problem loading the JS into JSC
    let errorCode = error.userInfo ? error.userInfo.errorCode : 'CLIENT_LOADING_ERROR';

    let message;
    if (errorCode === 'CLIENT_LOADING_ERROR') {
      message = `There was a problem loading this experience.`;
    } else {
      // some type of network error
      message = error.message; // by default use the raw error message -- it's probably nice

      // If we get a 404 and we're loading a shell app, put a nicer error
      if (error.code === 404 && this.props.isShell) {
        message = `There was a problem loading the app.`;
      }

      // Check to see if the user is loading a local URL -- if so, we can provide a nicer message.
      const url = error.originalUrl;
      if (
        (url && url.indexOf('.local') !== -1) ||
        url.indexOf('192.') !== -1 ||
        url.indexOf('10.') !== -1 ||
        url.indexOf('172.') !== -1
      ) {
        message =
          `There was a problem loading the experience. It looks like you may be using a ` +
          `LAN url. Make sure your device is on the same network as the server or try using a tunnel.`;
      }
    }

    return {
      message,
      details: {
        errorCode,
        metadata: error.userInfo ? error.userInfo.metadata : null,
      },
    };
  }

  _goToHome = () => {
    ExStore.dispatch(BrowserActions.foregroundHomeAsync());
  };
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
