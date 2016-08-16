/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserErrorView
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

import ExColors from 'ExColors';

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
      isShowingDetails = (props.error.manifest.packagerOpts && props.error.manifest.packagerOpts.dev);
    }
    this.state = {
      isShowingDetails,
    };
  }

  render() {
    let {
      error,
      style,
      onRefresh,
      ...props,
    } = this.props;

    let detailContent, detailButton;
    if (this.state.isShowingDetails) {
      detailContent = (
        <View>
          <Text style={styles.originalUrl}>
            {error.originalUrl}
          </Text>
          <Text style={styles.detail}>
            {`"${error.message}" (code ${error.code})`}
          </Text>
        </View>
      );
    } else {
      detailButton = (
        <Button onPress={() => this.setState({ isShowingDetails: true })} style={styles.detailButton}>
          Show Details
        </Button>
      );
    }

    return (
      <ScrollView
        alwaysBounceVertical={false}
        {...props}
        style={[styles.container, style]}>
        <Text style={styles.message}>There was a problem loading the experience.</Text>
        <View style={styles.buttonContainer}>
          <Button onPress={onRefresh} style={styles.button}>
            Try Again
          </Button>
          {detailButton}
        </View>
        {detailContent}
      </ScrollView>
    );
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
    marginTop: 4,
    marginHorizontal: 40,
    flexDirection: 'column',
  },
  button: {
    fontSize: 14,
    fontWeight: 'normal',
    padding: 16,
  },
  detailButton: {
    fontSize: 12,
    color: ExColors.grayText,
  },
});
