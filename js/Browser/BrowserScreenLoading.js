/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserScreenLoading
 */
'use strict';

import React from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native';

import FadeIn from '@expo/react-native-fade-in-image';
import { Constants } from 'expo';

export default class BrowserScreenLoading extends React.Component {
  render() {
    const { manifest, loadingStatus } = this.props;
    let loadingBackgroundColor = this._getLoadingBackgroundColor(manifest);
    let loadingIcon = this._renderManifestLoadingIcon(manifest);
    let loadingBackgroundImage = this._renderManifestLoadingBackgroundImage(manifest);
    let activityIndicator = this._renderLoadingActivityIndicator(manifest);

    return (
      <View
        pointerEvents="none"
        style={[styles.loadingIndicatorContainer, { backgroundColor: loadingBackgroundColor }]}>
        {loadingBackgroundImage}
        <View>
          {loadingIcon}
          {activityIndicator}
        </View>
        {this._renderLoadingStatusBar(loadingStatus)}
      </View>
    );
  }

  _renderLoadingStatusBar = loadingStatus => {
    if (loadingStatus) {
      return (
        <View style={styles.loadingStatusBar}>
          <Text style={styles.loadingStatusText}>{loadingStatus.status}</Text>
          {loadingStatus.total > 0 && (
            <Text style={styles.loadingPercentageText}>
              {(loadingStatus.done / loadingStatus.total * 100).toFixed(2)}%
            </Text>
          )}
        </View>
      );
    } else {
      return null;
    }
  };

  _renderManifestLoadingBackgroundImage = manifest => {
    if (manifest) {
      let backgroundImageUrl;
      if (this._isNewSplashScreenStyle(manifest)) {
        backgroundImageUrl = this._getNewSplashBackgroungImage(manifest);
      } else {
        backgroundImageUrl = manifest.getIn(['loading', 'backgroundImageUrl']);
      }
      if (backgroundImageUrl) {
        const resizeMode = this._getBackgroundImageResizeMode(manifest);
        return (
          <Image
            source={{ uri: backgroundImageUrl }}
            resizeMode={resizeMode}
            style={styles.loadingBackgroundImage}
          />
        );
      }
    }
    return null;
  };

  _renderManifestLoadingIcon = manifest => {
    if (manifest) {
      // Don't use loading icon if `splash` is set
      if (this._isNewSplashScreenStyle(manifest)) {
        return null;
      }

      let iconUrl = manifest.getIn(['loading', 'iconUrl']);
      let loadingBackgroundColor = this._getLoadingBackgroundColor(manifest);
      let backgroundImageUrl = manifest.getIn(['loading', 'backgroundImageUrl']);

      let placeholderBackgroundColor = loadingBackgroundColor;
      if (backgroundImageUrl) {
        placeholderBackgroundColor = 'transparent';
      }

      if (iconUrl) {
        return (
          <FadeIn
            placeholderStyle={{
              backgroundColor: placeholderBackgroundColor,
            }}>
            <Image
              source={{ uri: iconUrl }}
              resizeMode="center"
              style={{ width: 200, height: 200, marginVertical: 16 }}
            />
          </FadeIn>
        );
      }
    }
    return null;
  };

  _renderLoadingActivityIndicator = manifest => {
    if (manifest) {
      if (this._isNewSplashScreenStyle(manifest)) {
        return null;
      }
    }

    let loadingIndicatorStyle = this._getLoadingIndicatorStyle(manifest);
    return (
      <ActivityIndicator
        size="large"
        color={loadingIndicatorStyle === 'light' ? '#ffffff' : '#333333'}
        style={styles.loadingIndicator}
      />
    );
  };

  _getLoadingIndicatorStyle = manifest => {
    let loadingIndicatorStyle = 'default';
    if (manifest && manifest.getIn(['loading', 'loadingIndicatorStyleExperimental'])) {
      loadingIndicatorStyle = manifest.getIn(['loading', 'loadingIndicatorStyleExperimental']);
    }

    return loadingIndicatorStyle;
  };

  _getLoadingBackgroundColor = manifest => {
    if (manifest && this._isNewSplashScreenStyle(manifest)) {
      return this._getSplashLoadingBackgroundColor(manifest);
    }

    // If there is no `splash`, choose `loading.backgroundColor`
    if (manifest && manifest.getIn(['loading', 'backgroundColor'])) {
      return manifest.getIn(['loading', 'backgroundColor']);
    }

    return 'white';
  };

  _getSplashLoadingBackgroundColor = manifest => {
    // Try to load the platform specific background color, otherwise fall back to `splash.backgroundColor`
    if (Platform.OS === 'ios' && manifest.getIn(['ios', 'splash', 'backgroundColor'])) {
      return manifest.getIn(['ios', 'splash', 'backgroundColor']);
    }

    if (Platform.OS === 'android' && manifest.getIn(['android', 'splash', 'backgroundColor'])) {
      return manifest.getIn(['android', 'splash', 'backgroundColor']);
    }

    if (manifest.getIn(['splash', 'backgroundColor'])) {
      return manifest.getIn(['splash', 'backgroundColor']);
    }

    // Choose white if using `splash` but no color is specified
    return 'white';
  };

  _getBackgroundImageResizeMode(manifest) {
    if (!this._isNewSplashScreenStyle(manifest)) {
      return Image.resizeMode.contain;
    }

    let mode;
    if (Platform.OS === 'ios' && manifest.getIn(['ios', 'splash', 'resizeMode'])) {
      mode = manifest.getIn(['ios', 'splash', 'resizeMode']);
    } else if (Platform.OS === 'android' && manifest.getIn(['android', 'splash', 'resizeMode'])) {
      mode = manifest.getIn(['android', 'splash', 'resizeMode']);
    } else if (manifest.getIn(['splash', 'resizeMode'])) {
      mode = manifest.getIn(['splash', 'resizeMode']);
    }

    // If anything other than `cover` (including an invalid value, or `undefined`), return `contain` which is the default
    return mode === 'cover' ? Image.resizeMode.cover : Image.resizeMode.contain;
  }

  _getNewSplashBackgroungImage(manifest) {
    if (Platform.OS === 'ios') {
      if (
        Constants.platform.ios.userInterfaceIdiom === 'tablet' &&
        manifest.getIn(['ios', 'splash', 'tabletImageUrl'])
      ) {
        return manifest.getIn(['ios', 'splash', 'tabletImageUrl']);
      }

      if (manifest.getIn(['ios', 'splash', 'imageUrl'])) {
        return manifest.getIn(['ios', 'splash', 'imageUrl']);
      }
    }

    if (Platform.OS === 'android' && manifest.getIn(['android', 'splash'])) {
      const resolutions = ['xxxhdpi', 'xxhdpi', 'xhdpi', 'hdpi', 'mdpi', 'ldpi'];
      const splash = manifest.getIn(['android', 'splash']);
      // get the biggest available image
      resolutions.forEach(resolution => {
        if (splash.get(resolution)) {
          return splash.get(resolution);
        }
      });
    }

    // If platform-specific keys were not available, return the default
    return manifest.getIn(['splash', 'imageUrl']);
  }

  _isNewSplashScreenStyle = manifest => {
    if (manifest.getIn(['splash'])) {
      return true;
    }
    if (Platform.OS === 'ios' && manifest.getIn(['ios', 'splash'])) {
      return true;
    }
    if (Platform.OS === 'android' && manifest.getIn(['android', 'splash'])) {
      return true;
    }

    return false;
  };
}

const styles = StyleSheet.create({
  loadingBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  loadingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingStatusBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fafafa',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f3f3f3',
  },
  loadingStatusText: {
    color: '#a7a7a7',
    fontSize: 12,
    flex: 1,
  },
  loadingPercentageText: {
    color: '#a7a7a7',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
