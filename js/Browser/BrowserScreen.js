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
  NativeModules,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import BrowserErrorView from 'BrowserErrorView';
import ConsoleActions from 'ConsoleActions';
import ExColors from 'ExColors';
import ExManifests from 'ExManifests';
let { ExponentKernel } = NativeModules;
import Frame from 'Frame';
import MenuView from 'MenuView';
import { connect } from 'react-redux';

class BrowserScreen extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
  }

  static getDataProps(data, props) {
    let { url } = props;
    let { foregroundTaskUrl, isShell, shellManifestUrl, shellInitialUrl, isHomeVisible, isMenuVisible, isNuxFinished } = data.browser;
    let isForegrounded = (url === foregroundTaskUrl && !isHomeVisible);
    let shellTask = (shellManifestUrl) ? data.browser.tasks.get(shellManifestUrl) : null;
    return {
      url,
      isForegrounded,
      isMenuVisible,
      isNuxFinished,
      isShell: (isShell && url === shellManifestUrl),
      isLetterboxed: (isShell && url !== shellManifestUrl),
      task: data.browser.tasks.get(url),
      shellManifestUrl,
      shellInitialUrl,
      shellTask,
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: false,

      // we pass manifest as a mutable JS object down native code via Frame,
      // but within JS we take advantage of immutable equals on props.manifest
      manifestJS: (props.task && props.task.manifest) ? props.task.manifest.toJS() : null,
      initialPropsJS: (props.task && props.task.initialProps) ? props.task.initialProps.toJS() : null,
    };
  }

  render() {
    let content, loadingIndicator, menuView, errorView;
    let { task, isMenuVisible, isNuxFinished } = this.props;
    if (task) {
      if (task.loadingError) {
        errorView = (
          <BrowserErrorView
            error={task.loadingError}
            onRefresh={this._refresh}
            style={styles.errorView}
          />);
      } else if (isMenuVisible) {
        menuView = (
          <MenuView
            task={task}
            isNuxFinished={isNuxFinished}
            shouldFadeIn
          />
        );
      }
      if (task.bundleUrl) {
        content = (this.props.isLetterboxed) ? this._renderFrameWithLetterbox() : this._renderFrame();
        if (task.isLoading) {
          loadingIndicator = this._renderLoadingIndicator();
        }
      }
    }

    if (!content) {
      content = this._renderPlaceholder();
    }

    return (
      <View style={styles.container}>
        {content}
        {loadingIndicator}
        {menuView}
        {errorView}
      </View>
    );
  }

  _renderFrame() {
    let { source, appKey, debuggerHostname, debuggerPort } = ExManifests.getFramePropsFromManifest(
      this.state.manifestJS,
      this.props.task.bundleUrl
    );

    return (
      <Frame
        key="frame"
        ref={this._setFrame}
        source={source}
        applicationKey={appKey}
        debuggerHostname={debuggerHostname}
        debuggerPort={debuggerPort}
        initialProps={this._getInitialProps(this.state.initialPropsJS)}
        initialUri={this.props.url}
        manifest={this.state.manifestJS}
        style={styles.frame}
        onLoadingStart={this._handleFrameLoadingStart}
        onLoadingFinish={this._handleFrameLoadingFinish}
        onLoadingError={this._handleFrameLoadingError}
        onError={this._handleUncaughtError}
      />
    );
  }

  _renderFrameWithLetterbox() {
    let backButtonText;
    if (this.props.shellTask && this.props.shellTask.manifest && this.props.shellTask.manifest.get('name')) {
      backButtonText = `Back to ${this.props.shellTask.manifest.get('name')}`;
    } else {
      backButtonText = 'Back';
    }
    return (
      <View style={styles.letterbox}>
        <StatusBar
          barStyle="light-content"
          hidden={false}
          animated
        />
        <View style={styles.letterboxTopBar}>
          <TouchableWithoutFeedback onPress={this._onPressLetterbox}>
            <View><Text style={styles.letterboxText}>{backButtonText}</Text></View>
          </TouchableWithoutFeedback>
        </View>
        {this._renderFrame()}
      </View>
    );
  }

  _renderPlaceholder() {
    let content;
    if (this.props.isShell) {
      // possibly null
      content = this._renderManifestLoadingIcon();
    } else {
      content = (<Text style={styles.placeholderText}>EXPONENT</Text>);
    }
    return (
      <View style={styles.placeholder}>
        {content}
      </View>
    );
  }

  _renderLoadingIndicator() {
    let loadingIcon = this._renderManifestLoadingIcon();
    return (
      <View pointerEvents="none" style={styles.loadingIndicatorContainer}>
        <View>
          {loadingIcon}
          <ActivityIndicator
            size="large"
            color={ExColors.navy}
            style={styles.loadingIndicator}
          />
        </View>
      </View>
    );
  }

  _renderManifestLoadingIcon() {
    let { task } = this.props;
    if (task) {
      let { manifest } = task;
      if (manifest && manifest.getIn(['loading', 'iconUrl'])) {
        return (
          <Image
            source={{uri: manifest.getIn(['loading', 'iconUrl'])}}
            resizeMode="contain"
            style={{width: 96, height: 96, marginVertical: 16}}
          />
        );
      }
    }
    return null;
  }

  componentDidMount() {
    this._refreshSub = Browser.addRefreshListener(() => {
      if (this.props.isForegrounded) {
        this._refresh();
      }
    });
  }

  componentWillUnmount() {
    this._refreshSub.remove();
  }

  componentWillReceiveProps(nextProps) {
    this._recomputePropsJS(nextProps);
  }

  _getInitialProps(baseProps) {
    // start with whatever came from the browser task's initial props (e.g. a push notification payload)
    if (!baseProps) {
      baseProps = {};
    }

    // add a few more things
    baseProps.manifest = this.state.manifestJS;
    baseProps.shell = this.props.isShell;
    if (this.props.isShell && this.props.shellInitialUrl) {
      baseProps.initialUri = this.props.shellInitialUrl;
    } else {
      baseProps.initialUri = this.props.url;
    }

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
      if (!this.props.task || task.initialProps !== this.props.task.initialProps) {
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

  @autobind
  _setFrame(frame) {
    this._frame = frame;
  }

  @autobind
  _handleFrameLoadingStart(event) {
    this.props.dispatch(ConsoleActions.clearConsole());
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, true));
  }

  @autobind
  _handleFrameLoadingFinish(event) {
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, false));
  }

  @autobind
  _handleFrameLoadingError(event) {
    this.props.dispatch(BrowserActions.setLoadingState(this.props.url, false));
    let { nativeEvent } = event;

    this.props.dispatch(BrowserActions.showLoadingError(nativeEvent.code, nativeEvent.description, this.props.url, this.props.task.manifest));
  }

  @autobind
  _handleUncaughtError(event) {
    let { dispatch } = this.props;
    let { id, message, stack, fatal } = event.nativeEvent;
    let action = ConsoleActions.logUncaughtError(id, message, stack, fatal, this.props.url);
    dispatch(action);
    if (fatal) {
      dispatch(BrowserActions.showLoadingError(id, message, this.props.url, this.props.task.manifest));
    }
  }

  @autobind
  _refresh() {
    if (this.props.task.loadingError) {
      let urlToRefresh = this.props.task.loadingError.originalUrl;
      this.props.dispatch(BrowserActions.clearTaskWithError(urlToRefresh));
      ExponentKernel.openURL(urlToRefresh);
      return;
    }
    this.setState(state => {
      if (!this._frame) {
        console.error('Trying to refresh but there is no frame to refresh');
        return;
      }
      this._frame.reload();
    });
  }

  @autobind
  _onPressLetterbox() {
    if (this.props.shellManifestUrl) {
      this.props.dispatch(BrowserActions.foregroundUrlAsync(this.props.shellManifestUrl));
    }
  }
}

export default connect(
  (data, props) => BrowserScreen.getDataProps(data, props),
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
    height: 40,
    alignItems: 'center',
  },
  letterboxText: {
    color: 'white',
    paddingTop: 18,
  },
  loadingIndicatorContainer: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
