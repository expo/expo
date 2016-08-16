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

import autobind from 'autobind-decorator';

import BrowserActions from 'BrowserActions';
import ExStore from 'ExStore';
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
    Linking.addEventListener('url', this._handleUrl);
    DeviceEventEmitter.addListener('Exponent.notification', this._handleNotification);
    if (this.props.shell) {
      this._handleUrl({ url: this.props.shellManifestUrl });
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleUrl);
  }

  @autobind
  _handleUrl(event) {
    let targetUrl = event.url;

    // don't compare to old url and refresh, because the manifest at this url may have changed
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(BrowserActions.navigateToUrlAsync(targetUrl));
  }

  @autobind
  _handleNotification(event) {
    let { body, experienceId } = event;
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(BrowserActions.navigateToExperienceIdWithNotificationAsync(experienceId, body));
  }
}

export default ExponentApp;
