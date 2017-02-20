/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExponentApp
 * @flow
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  DeviceEventEmitter,
  Linking,
} from 'react-native';

import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ExStore from 'ExStore';
import ExponentKernel from 'ExponentKernel';
import KernelNavigator from 'KernelNavigator';

class ExponentApp extends React.Component {
  static propTypes = {
    shell: PropTypes.bool,
    shellManifestUrl: PropTypes.string,
  }

  render() {
    return (
      <KernelNavigator />
    );
  }

  constructor(props, context) {
    super(props, context);
    if (props.shell) {
      ExStore.dispatch(BrowserActions.setShellPropertiesAsync(props.shell, props.shellManifestUrl));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.shell !== this.props.shell) {
      ExStore.dispatch(BrowserActions.setShellPropertiesAsync(nextProps.shell, nextProps.shellManifestUrl));
    }
  }

  componentDidMount() {
    ExponentKernel.onLoaded();

    if (ExponentKernel.__isFake) {
      return;
    }

    Linking.addEventListener('url', this._handleUrl);
    DeviceEventEmitter.addListener('Exponent.notification', this._handleNotification);
    DeviceEventEmitter.addListener('ExponentKernel.refresh', Browser.refresh);
    requestAnimationFrame(async () => {
      let initialUrl = await Linking.getInitialURL();
      if (this.props.shell) {
        if (initialUrl) {
          ExStore.dispatch(BrowserActions.setInitialShellUrl(initialUrl));
        }
        this._handleUrl({ url: this.props.shellManifestUrl });
      } else {
        if (initialUrl) {
          // browser launched with an initial url
          this._handleUrl({ url: initialUrl });
        }
      }
    });
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleUrl);
  }

  _handleUrl = (event) => {
    let targetUrl = event.url;

    // don't compare to old url and refresh, because the manifest at this url may have changed
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(BrowserActions.navigateToUrlAsync(targetUrl));
  }

  _handleNotification = (event) => {
    let { body, experienceId } = event;
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(BrowserActions.navigateToExperienceIdWithNotificationAsync(experienceId, body));
  }
}

export default ExponentApp;
