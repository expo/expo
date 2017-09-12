/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserScreen
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import FadeIn from '@expo/react-native-fade-in-image';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import BrowserErrorView from 'BrowserErrorView';
import ExColors from 'ExColors';
import ExManifests from 'ExManifests';
import ExponentKernel from 'ExponentKernel';
import Frame from 'Frame';
import { connect } from 'react-redux';
import { Constants } from 'expo';

class BrowserScreen extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
  };

  static getDataProps(data, props) {
    let { url } = props;
    let {
      foregroundTaskUrl,
      isShell,
      shellManifestUrl,
      shellInitialUrl,
      isHomeVisible,
      isMenuVisible,
      isNuxFinished,
    } = data.browser;
    let isForegrounded = url === foregroundTaskUrl && !isHomeVisible;
    let shellTask = shellManifestUrl
      ? data.browser.tasks.get(shellManifestUrl)
      : null;

    return {
      url,
      isForegrounded,
      isNuxFinished,
      isMenuVisible,
      isShell: isShell && url === shellManifestUrl,
      isLetterboxed: isShell && url !== shellManifestUrl,
      task: data.browser.tasks.get(url),
      shellManifestUrl,
      shellInitialUrl,
      shellTask,
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      loadingStatus: null,

      // we pass manifest as a mutable JS object down native code via Frame,
      // but within JS we take advantage of immutable equals on props.manifest
      manifestJS:
        props.task && props.task.manifest ? props.task.manifest.toJS() : null,
      initialPropsJS:
        props.task && props.task.initialProps
          ? props.task.initialProps.toJS()
          : null,
    };
  }

  render() {
    let content, loadingIndicator, errorView;
    let { task } = this.props;
    if (task) {
      if (task.loadingError) {
        errorView = (
          <BrowserErrorView
            error={task.loadingError}
            isShell={this.props.isShell}
            shellManifestUrl={this.props.shellManifestUrl}
            onRefresh={this._refresh}
            style={styles.errorView}
          />
        );
      }
      if (task.bundleUrl) {
        content = this._renderFrame();
        if (task.isLoading) {
          loadingIndicator = this._renderLoadingIndicator();
        }
      }
    }

    if (!content) {
      content = this._renderPlaceholder();
    }

    let everything = (
      <View style={{ flex: 1 }}>
        {content}
        {loadingIndicator}
        {errorView}
      </View>
    );
    return (
      <View style={styles.container}>
        {this.props.isLetterboxed
          ? this._renderLetterboxWithContent(everything)
          : everything}
      </View>
    );
  }

  componentDidMount() {
    ExponentKernel.splashLoadingDidDisplay();
  }

  _renderFrame() {
    let {
      source,
      appKey,
      debuggerHostname,
      debuggerPort,
    } = ExManifests.getFramePropsFromManifest(
      this.state.manifestJS,
      this.props.task.bundleUrl
    );

    const initialProps = this._getInitialProps(this.state.initialPropsJS);
    return (
      <Frame
        key="frame"
        ref={this._setFrame}
        source={source}
        applicationKey={appKey}
        debuggerHostname={debuggerHostname}
        debuggerPort={debuggerPort}
        initialProps={initialProps}
        initialUri={initialProps.initialUri}
        manifest={this.state.manifestJS}
        style={styles.frame}
        onLoadingStart={this._handleFrameLoadingStart}
        onLoadingProgress={this._handleLoadingProgress}
        onLoadingFinish={this._handleFrameLoadingFinish}
        onLoadingError={this._handleFrameLoadingError}
        onError={this._handleUncaughtError}
      />
    );
  }

  _renderLetterboxWithContent(content) {
    let backButtonText;
    if (
      this.props.shellTask &&
      this.props.shellTask.manifest &&
      this.props.shellTask.manifest.get('name')
    ) {
      backButtonText = `Back to ${this.props.shellTask.manifest.get('name')}`;
    } else {
      backButtonText = 'Back';
    }
    return (
      <View style={styles.letterbox}>
        <StatusBar barStyle="light-content" hidden={false} animated />
        <View style={styles.letterboxTopBar}>
          <TouchableWithoutFeedback onPress={this._onPressLetterbox}>
            <View>
              <Text style={styles.letterboxText}>
                {backButtonText}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
        {content}
      </View>
    );
  }

  _renderPlaceholder() {
    let content;
    if (this.props.isShell) {
      // possibly null
      content = this._renderManifestLoadingIcon();
    } else {
      content = <Text style={styles.placeholderText}>EXPO</Text>;
    }
    return (
      <View style={styles.placeholder}>
        {content}
      </View>
    );
  }

  _getLoadingBackgroundColor() {
    let { task } = this.props;
    let { manifest } = task;

    if (manifest && this._isNewSplashScreenStyle(manifest)) {
      // Try to load the platform specific background color, otherwise fall back to `splash.backgroundColor`
      if (
        Platform.OS === 'ios' &&
        manifest.getIn(['ios', 'splash', 'backgroundColor'])
      ) {
        return manifest.getIn(['ios', 'splash', 'backgroundColor']);
      }

      if (
        Platform.OS === 'android' &&
        manifest.getIn(['android', 'splash', 'backgroundColor'])
      ) {
        return manifest.getIn(['android', 'splash', 'backgroundColor']);
      }

      if (manifest.getIn(['splash', 'backgroundColor'])) {
        return manifest.getIn(['splash', 'backgroundColor']);
      }
    }

    // If no background color found in new `splash` style, fall back to `loading.backgroundColor`
    if (manifest && manifest.getIn(['loading', 'backgroundColor'])) {
      return manifest.getIn(['loading', 'backgroundColor']);
    }

    return 'white';
  }

  _getLoadingIndicatorStyle() {
    let { task } = this.props;
    let { manifest } = task;

    let loadingIndicatorStyle = 'default';
    if (
      manifest &&
      manifest.getIn(['loading', 'loadingIndicatorStyleExperimental'])
    ) {
      loadingIndicatorStyle = manifest.getIn([
        'loading',
        'loadingIndicatorStyleExperimental',
      ]);
    }

    return loadingIndicatorStyle;
  }

  _renderLoadingIndicator() {
    let loadingBackgroundColor = this._getLoadingBackgroundColor();
    let loadingIcon = this._renderManifestLoadingIcon();
    let loadingBackgroundImage = this._renderManifestLoadingBackgroundImage();
    let activityIndicator = this._renderLoadingActivityIndicator();
    let { loadingStatus } = this.state;

    return (
      <View
        pointerEvents="none"
        style={[
          styles.loadingIndicatorContainer,
          { backgroundColor: loadingBackgroundColor },
        ]}>
        {loadingBackgroundImage}
        <View>
          {loadingIcon}
          {activityIndicator}
        </View>
        {loadingStatus !== null &&
          <View style={styles.loadingStatusBar}>
            <Text style={styles.loadingStatusText}>
              {loadingStatus.status}
            </Text>
            {loadingStatus.total > 0 &&
              <Text style={styles.loadingPercentageText}>
                {(loadingStatus.done / loadingStatus.total * 100).toFixed(2)}%
              </Text>}
          </View>}
      </View>
    );
  }

  _renderLoadingActivityIndicator() {
    let { task } = this.props;
    if (task) {
      let { manifest } = task;
      if (manifest) {
        if (this._isNewSplashScreenStyle(manifest)) {
          return null;
        }
      }
    }

    let loadingIndicatorStyle = this._getLoadingIndicatorStyle();
    return (
      <ActivityIndicator
        size="large"
        color={loadingIndicatorStyle === 'light' ? '#ffffff' : '#333333'}
        style={styles.loadingIndicator}
      />
    );
  }

  _renderManifestLoadingIcon() {
    let { task } = this.props;
    if (task) {
      let { manifest } = task;
      if (manifest) {
        // Don't use loading icon if new manifest.loading.splash.image.ios.backgroundImageUrl is set
        if (this._isNewSplashScreenStyle(manifest)) {
          return (
            // This view is empty, but positions the loading indicator corrextly
            <View style={{ width: 200, height: 200, marginVertical: 16 }} />
          );
        }

        let iconUrl = manifest.getIn(['loading', 'iconUrl']);
        let loadingBackgroundColor = this._getLoadingBackgroundColor();
        let backgroundImageUrl = manifest.getIn([
          'loading',
          'backgroundImageUrl',
        ]);

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
    }
    return null;
  }

  _renderManifestLoadingBackgroundImage() {
    let { task } = this.props;
    let { manifest } = task;
    if (manifest) {
      var backgroundImageUrl;
      if (this._isNewSplashScreenStyle(manifest)) {
        backgroundImageUrl = this._getNewSplashBackgroungImage(manifest);
      }
      let resizeMode = this._getBackgroundImageResizeMode(manifest);
      if (!backgroundImageUrl) {
        backgroundImageUrl = manifest.getIn(['loading', 'backgroundImageUrl']);
      }
      if (manifest && backgroundImageUrl) {
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
  }

  _getNewSplashBackgroungImage(manifest) {
    if (Platform.OS === 'ios') {
      if (
        Constants.platform.ios.userInterfaceIdiom === 'tablet' &&
        manifest.getIn(['ios', 'splash', 'imageUrl'])
      ) {
        return manifest.getIn(['ios', 'splash', 'tabletImageUrl']);
      }

      if (manifest.getIn(['ios', 'splash', 'imageUrl'])) {
        return manifest.getIn(['ios', 'splash', 'imageUrl']);
      }
    }

    if (Platform.OS === 'android') {
      return manifest.getIn(['android', 'splash', 'backgroundImageUrl']);
    }

    // If platform-specific keys were not available, return the default
    return manifest.getIn(['splash', 'imageUrl']);
  }

  _getBackgroundImageResizeMode(manifest) {
    if (!this._isNewSplashScreenStyle(manifest)) {
      return Image.resizeMode.contain;
    }

    let mode;
    if (
      Platform.OS === 'ios' &&
      manifest.getIn(['ios', 'splash', 'resizeMode'])
    ) {
      mode = manifest.getIn(['ios', 'splash', 'resizeMode']);
    } else if (
      Platform.OS === 'android' &&
      manifest.getIn(['android', 'splash', 'resizeMode'])
    ) {
      mode = manifest.getIn(['android', 'splash', 'resizeMode']);
    } else if (manifest.getIn(['splash', 'resizeMode'])) {
      mode = manifest.getIn(['splash', 'resizeMode']);
    }

    // If anything other than `cover` (including an invalid value, or `undefined`), return `contain` which is the default
    return mode === 'cover' ? Image.resizeMode.cover : Image.resizeMode.contain;
  }

  componentWillReceiveProps(nextProps) {
    this._recomputePropsJS(nextProps);
  }

  _getInitialProps(baseInitialProps) {
    // start with whatever came from the browser task's initial props (e.g. a push notification payload)
    let baseProps = {};
    if (baseInitialProps) {
      for (let key in baseInitialProps) {
        if (baseInitialProps.hasOwnProperty(key)) {
          baseProps[key] = baseInitialProps[key];
        }
      }
    }

    // add a few more things
    baseProps.manifest = this.state.manifestJS;
    baseProps.shell = this.props.isShell;
    if (this.props.isShell && this.props.shellInitialUrl) {
      baseProps.initialUri = this.props.shellInitialUrl;
    } else {
      baseProps.initialUri = this.props.url;
    }

    let appOwnership;
    if (this.props.isShell) {
      appOwnership = 'standalone';
    } else if (this.props.isLetterboxed) {
      appOwnership = 'guest';
    } else {
      appOwnership = 'expo';
    }
    baseProps.appOwnership = appOwnership;

    return baseProps;
  }

  _recomputePropsJS(props) {
    let { task } = props;
    if (task) {
      // immutable equals
      if (!this.props.task || task.manifest !== this.props.task.manifest) {
        if (task.manifest) {
          this.setState({ manifestJS: task.manifest.toJS() });
        } else {
          this.setState({ manifestJS: null });
        }
      }
      if (
        !this.props.task ||
        task.initialProps !== this.props.task.initialProps
      ) {
        if (task.initialProps) {
          this.setState({ initialPropsJS: task.initialProps.toJS() });
        } else {
          this.setState({ initialPropsJS: null });
        }
      }
    } else {
      this.setState({
        manifestJS: null,
        initialPropsJS: null,
      });
    }
  }

  _isNewSplashScreenStyle(manifest) {
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
  }

  _setFrame = frame => {
    this._frame = frame;
  };

  _handleFrameLoadingStart = event => {
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, true));
  };

  _handleLoadingProgress = event => {
    this.setState({ loadingStatus: event.nativeEvent });
  };

  _handleFrameLoadingFinish = event => {
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, false));
    if (
      !this.props.isNuxFinished &&
      !this.props.isLetterboxed &&
      !this.props.isShell
    ) {
      setTimeout(() => {
        this.props.dispatch(BrowserActions.showMenuAsync(true));
      }, 200);
    } else if (this.props.isMenuVisible) {
      this.props.dispatch(BrowserActions.showMenuAsync(false));
    }

    this.setState({ loadingStatus: null });
  };

  _handleFrameLoadingError = event => {
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, false));
    let { nativeEvent } = event;

    this.props.dispatch(
      BrowserActions.showLoadingError(
        nativeEvent.code,
        nativeEvent.description,
        this.props.url,
        this.props.task.manifest
      )
    );

    this.setState({ loadingStatus: null });
  };

  _handleUncaughtError = event => {
    let { id, message, stack, fatal } = event.nativeEvent;
    if (fatal) {
      let isDeveloper = false;
      if (this.props.task && this.props.task.manifest) {
        isDeveloper = this.props.task.manifest.get('developer');
      }
      if (!isDeveloper) {
        // if developer == true, RCTRedBox will show up instead
        this._maybeRecoverFromErrorAsync(event);
      }
    }
  };

  _maybeRecoverFromErrorAsync = async event => {
    let { id, message, stack, fatal } = event.nativeEvent;
    let shouldReload = await ExponentKernel.shouldCurrentTaskAutoReload();
    if (shouldReload) {
      // call this._refresh rather than Browser.refresh because it works
      // in both browser and shell apps.
      this._refresh();
    } else {
      // show error screen with manual reload button
      this.props.dispatch(
        BrowserActions.showLoadingError(
          id,
          message,
          this.props.url,
          this.props.task.manifest
        )
      );
    }
  };

  _refresh = () => {
    if (this.props.task.loadingError) {
      let urlToRefresh = this.props.task.loadingError.originalUrl;
      this.props.dispatch(BrowserActions.clearTaskWithError(urlToRefresh));
      if (this.props.isShell) {
        this.props.dispatch(
          BrowserActions.navigateToUrlAsync(this.props.shellManifestUrl)
        );
      } else {
        ExponentKernel.openURL(urlToRefresh);
      }
      return;
    }
    this.setState(state => {
      if (!this._frame) {
        console.error('Trying to refresh but there is no frame to refresh');
        return;
      }
      this._frame.reload();
    });
  };

  _onPressLetterbox = () => {
    if (this.props.shellManifestUrl) {
      this.props.dispatch(
        BrowserActions.foregroundUrlAsync(this.props.shellManifestUrl)
      );
    }
  };
}

export default connect((data, props) =>
  BrowserScreen.getDataProps(data, props)
)(BrowserScreen);

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  frame: {
    flex: 1,
  },
  letterbox: {
    flex: 1,
    backgroundColor: 'black',
  },
  letterboxTopBar: {
    height: 42,
    alignItems: 'center',
  },
  letterboxText: {
    color: 'white',
    paddingTop: 20,
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
  loadingBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
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
  errorView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: ExColors.navy,
    fontSize: 32,
    fontWeight: '100',
    letterSpacing: 9,
    marginTop: -200,
  },
});
