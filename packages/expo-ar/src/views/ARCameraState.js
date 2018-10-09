// @flow

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as AR from '../AR';

console.log(AR);

const removeSuffix = str => {
  if (typeof str === 'string') {
    const components = str.split('0');
    return components[components.length - 1];
  }
};

export default class ARCameraState extends React.Component {
  state = {};
  static defaultProps = {
    [TrackingStateReasons.None]: { title: 'Having trouble collecting data' },
    [TrackingStateReasons.Initializing]: {
      title: 'Initializing',
      subtitle: 'Move the camera around for better results',
    },
    [TrackingStateReasons.ExcessiveMotion]: {
      title: 'Excessive motion',
      subtitle: 'Try moving your camera slower',
    },
    [TrackingStateReasons.InsufficientFeatures]: {
      title: 'insufficient features',
      subtitle: 'Try moving your camera around more',
    },
    [TrackingStateReasons.Relocalizing]: { title: 'Relocalizing' },

    trackingStateStyles: {
      [TrackingStates.NotAvailable]: { color: '#D0021B' },
      [TrackingStates.Limited]: { color: '#F5C423' },
      [TrackingStates.Normal]: { color: '#ffffff' },
    },
  };
  componentDidMount() {
    onCameraDidChangeTrackingState(tracking => this.setState(tracking));
  }

  componentWillUnmount() {
    removeAllListeners(AR.EventTypes.CameraDidChangeTrackingState);
  }

  render() {
    const {
      style,
      titleStyle,
      subtitleStyle,
      children,
      trackingStateStyles,
    } = this.props;
    const { trackingState, trackingStateReason } = this.state;

    let trackingStateMessage = {};
    const _trackingState = removeSuffix(trackingState);
    let trackingStateStyle = trackingStateStyles[_trackingState] || {};

    switch (_trackingState) {
      case TrackingStates.NotAvailable:
        trackingStateMessage = { title: 'Not Available' };
        break;
      case TrackingStates.Limited:
        const reason = removeSuffix(trackingStateReason);
        trackingStateMessage = this.props[reason];
        break;
      case TrackingStates.Normal:
        break;
    }
    const { title, subtitle } = trackingStateMessage;

    return (
      <View style={[styles.container, style]}>
        {title && (
          <Text style={[styles.title, trackingStateStyle, titleStyle]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 56,
    right: 12,
    left: 12,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
  },
  subtitle: {
    color: '#BEBEBE',
    textAlign: 'center',
    fontSize: 16,
  },
});
