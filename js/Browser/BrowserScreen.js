/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserScreen
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import BrowserErrorView from 'BrowserErrorView';
import BrowserScreenLoading from 'BrowserScreenLoading';
import ExColors from 'ExColors';
import ExManifests from 'ExManifests';
import ExponentKernel from 'ExponentKernel';
import Frame from 'Frame';
import { connect } from 'react-redux';

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
    let content, loadingView, errorView;
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
          loadingView = (
            <BrowserScreenLoading
              loadingStatus={this.state.loadingStatus}
              manifest={task.manifest}
            />
          );
        }
      }
    }

    if (!content) {
      content = this._renderPlaceholder();
    }

    let everything = (
      <View style={{ flex: 1 }}>
        {content}
        {loadingView}
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
      content = null;
    } else {
      content = <Text style={styles.placeholderText}>EXPO</Text>;
    }
    return (
      <View style={styles.placeholder}>
        {content}
      </View>
    );
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
