/* @flow */

import Exponent from 'exponent';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@exponent/vector-icons';
import Colors from '../constants/Colors';

import BrowserActions from 'BrowserActions';

const LoadingWarningDelayMs = 5000;

@connect(data => GlobalLoadingOverlay.getDataProps(data))
export default class GlobalLoadingOverlay extends React.Component {
  static getDataProps(data) {
    return {
      isLoading: data.browser.isKernelLoading,
    };
  }

  state = {
    loadingIsSlow: false,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.isLoading && !this.props.isLoading) {
      this._initializeWarningTimer();
    } else if (this.props.isLoading && !nextProps.isLoading) {
      this._clearWarningTimer();
    }
  }

  _initializeWarningTimer = () => {
    this._loadingStartDate = new Date();
    this._warningTimer = setTimeout(
      () => {
        this.setState({ loadingIsSlow: true });
      },
      LoadingWarningDelayMs
    );
  };

  _clearWarningTimer = () => {
    this._loadingStartDate = null;
    clearTimeout(this._warningTimer);
    this.setState({ loadingIsSlow: false });
  };

  render() {
    if (!this.props.isLoading) {
      return <View />;
    }

    return (
      <Exponent.Components.BlurView
        tint="default"
        intensity={100}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.blackText} size="small" />
          <Text style={[styles.loadingText, { color: Colors.blackText }]}>
            Opening project...
          </Text>
        </View>

        {this._maybeRenderWarning()}

        <TouchableOpacity
          hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
          activeOpacity={0.5}
          style={styles.button}
          onPress={this._cancelLoadingExperienceAsync}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Exponent.Components.BlurView>
    );
  }

  _maybeRenderWarning = () => {
    if (!this.state.loadingIsSlow) {
      return;
    }

    return (
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          This is taking much longer than it should. You might want to cancel and check your internet connectivity.
        </Text>
      </View>
    );
  };

  _cancelLoadingExperienceAsync = async () => {
    try {
      this.props.dispatch(
        BrowserActions.cancelLoadingMostRecentManifestRequest()
      );
    } catch (e) {
      console.log(`Unable to cancel: ${e.message}`);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: -2,
  },
  loadingText: {
    color: Colors.blackText,
    fontSize: 17,
    marginLeft: 7,
    fontWeight: '600',
  },
  button: {
    borderRadius: 3,
    alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.9)',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 9,
    justifyContent: 'center',
    marginTop: 30,
  },
  warningContainer: {
    marginHorizontal: 10,
    maxWidth: 300,
    marginTop: 15,
  },
  warningText: {
    color: Colors.blackText,
    textAlign: 'center',
    opacity: 0.8,
    fontSize: 14,
  },
  cancelText: {
    color: Colors.blackText,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
