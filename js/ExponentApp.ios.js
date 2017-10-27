/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExponentApp
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, DeviceEventEmitter, Linking, View } from 'react-native';

import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ExStore from 'ExStore';
import ExponentKernel from 'ExponentKernel';
import LocalStorage from './Storage/LocalStorage';
import KernelNavigator from 'KernelNavigator';

class ExponentApp extends React.Component {
  static propTypes = {
    shell: PropTypes.bool,
    shellManifestUrl: PropTypes.string,
  };

  state = {
    dataMigrationComplete: false,
  };

  render() {
    if (!this.state.dataMigrationComplete) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator />
        </View>
      );
    }

    return <KernelNavigator />;
  }

  constructor(props: any, context: any) {
    super(props, context);
    if (props.shell) {
      ExStore.dispatch(BrowserActions.setShellPropertiesAsync(props.shell, props.shellManifestUrl));
    }
  }

  componentWillMount() {
    this._performDataMigrationAsync();
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.shell !== this.props.shell) {
      ExStore.dispatch(
        BrowserActions.setShellPropertiesAsync(nextProps.shell, nextProps.shellManifestUrl)
      );
    }
  }

  _initialize = async () => {
    ExponentKernel.onLoaded();

    if (ExponentKernel.__isFake) {
      return;
    }

    Linking.addEventListener('url', this._handleUrl);
    DeviceEventEmitter.addListener('Exponent.notification', this._handleNotification);
    DeviceEventEmitter.addListener('ExponentKernel.refresh', Browser.refresh);

    let initialUrl = await Linking.getInitialURL();
    requestAnimationFrame(() => {
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
  };

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleUrl);
  }

  async _performDataMigrationAsync() {
    await LocalStorage.maybeMigrateFromLegacyAsync();
    this.setState({ dataMigrationComplete: true });
    this._initialize();
  }

  _handleUrl = (event: { url: string }) => {
    let targetUrl = event.url;

    // don't compare to old url and refresh, because the manifest at this url may have changed
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(BrowserActions.navigateToUrlAsync(targetUrl));
  };

  _handleNotification = (event: { body: any, experienceId: string }) => {
    let { body, experienceId } = event;
    ExStore.dispatch(BrowserActions.setKernelLoadingState(true));
    ExStore.dispatch(
      BrowserActions.navigateToExperienceIdWithNotificationAsync(experienceId, body)
    );
  };
}

export default ExponentApp;
