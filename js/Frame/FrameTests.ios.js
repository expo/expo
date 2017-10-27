/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule FrameTests
 */

import React, { PropTypes } from 'react';
import { NativeModules, Text, View } from 'react-native';

import autobind from 'autobind-decorator';

import ExManifests from 'ExManifests';
import FeaturedExperiences from 'FeaturedExperiences';
import Frame from 'Frame';

const { TestModule } = NativeModules;

class FrameLoadBundleTest extends React.Component {
  static propTypes = {
    manifestUrl: PropTypes.string,
    loadFeaturedExperience: PropTypes.bool,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      bundleUrl: null,
      manifest: null,
    };
  }

  componentDidMount() {
    this._runTestAsync();
  }

  render() {
    let { bundleUrl, manifest } = this.state;
    if (!bundleUrl || !manifest) {
      return (
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text>Loading...</Text>
        </View>
      );
    }

    let { source, appKey, debuggerHostname, debuggerPort } = ExManifests.getFramePropsFromManifest(
      manifest,
      bundleUrl
    );

    return (
      <Frame
        key="frame"
        source={source}
        applicationKey={appKey}
        debuggerHostname={debuggerHostname}
        debuggerPort={debuggerPort}
        manifest={manifest}
        style={{ width: 320, height: 640 }}
        onLoadingStart={this._handleFrameLoadingStart}
        onLoadingFinish={this._handleFrameLoadingFinish}
        onLoadingError={this._handleFrameLoadingError}
        onError={this._handleUncaughtError}
      />
    );
  }

  @autobind
  async _runTestAsync() {
    let manifestUrlToLoad;
    if (this.props.manifestUrl) {
      manifestUrlToLoad = this.props.manifestUrl;
    } else if (this.props.loadFeaturedExperience) {
      let featuredExperiences = FeaturedExperiences.getFeatured();
      manifestUrlToLoad = featuredExperiences[0].url;
    } else {
      throw new Error('Cannot load frame: No manifest url provided');
    }

    let { bundleUrl, manifest } = await ExManifests.manifestUrlToBundleUrlAndManifestAsync(
      manifestUrlToLoad
    );
    this.setState({
      bundleUrl,
      manifest,
    });
  }

  @autobind
  _handleFrameLoadingStart(event) {}

  @autobind
  _handleFrameLoadingFinish(event) {
    TestModule.markTestCompleted();
  }

  @autobind
  _handleFrameLoadingError(event) {
    let { nativeEvent } = event;
    throw new Error(`frameLoadingError ${nativeEvent.code}: ${nativeEvent.description}`);
  }

  @autobind
  _handleUncaughtError(event) {
    let { id, message } = event.nativeEvent;
    throw new Error(`frameUncaughtError ${id}: ${message}`);
  }
}

export default class FrameTests extends React.Component {
  render() {
    return <FrameLoadBundleTest {...this.props} />;
  }
}
