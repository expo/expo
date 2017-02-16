/* @flow */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';

@connect(data => GlobalLoadingOverlay.getDataProps(data))
export default class GlobalLoadingOverlay extends React.Component {
  static getDataProps(data) {
    return {
      isLoading: data.browser.isKernelLoading,
    };
  }

  render() {
    if (!this.props.isLoading) {
      return <View />;
    }

    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
