/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule KernelNavigator
 * @flow
 */
'use strict';

import React from 'react';
import {
  DeviceEventEmitter,
  NativeModules,
  StyleSheet,
  View,
} from 'react-native';
import ExNavigator from '@exponent/react-native-navigator';
import TimerMixin from 'react-timer-mixin';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ConsoleActions from 'ConsoleActions';
import ExRouter from 'ExRouter';
import reactMixin from 'react-mixin';
import { connect } from 'react-redux';

const {
  ExponentKernel,
} = NativeModules;

const KERNEL_ROUTE_HOME = 0;
const KERNEL_ROUTE_BROWSER = 1;

class KernelNavigator extends React.Component {
  static getDataProps(data) {
    let {
      isShell,
      shellManifestUrl,
      isHomeVisible,
      foregroundTaskUrl,
      tasks,
      history,
    } = data.browser;
    return {
      isShell,
      shellManifestUrl,
      isHomeVisible,
      foregroundTaskUrl,
      tasks,
      history,
      consoleHistory: data.console.history,
    };
  }

  constructor(props, context) {
    super(props, context);
  }

  componentWillMount() {
    this._homeRoute = ExRouter.getHomeRoute();
    this._browserRoutes = {};
    if (this.props.isShell) {
      ExponentKernel.routeDidForeground(KERNEL_ROUTE_BROWSER, {
        url: this.props.shellManifestUrl,
      });
    } else {
      ExponentKernel.routeDidForeground(KERNEL_ROUTE_HOME, null);
    }
  }

  componentDidMount() {
    this._refreshSubscription = Browser.addRefreshListener(() => {
      // bypass validation of the link and just try to open it again
      if (this.props.foregroundTaskUrl && this.props.isHomeVisible) {
        ExponentKernel.openURL(this.props.foregroundTaskUrl);
      }
    });
    DeviceEventEmitter.addListener('ExponentKernel.foregroundTask', this._foregroundTask);
  }

  componentWillUnmount() {
    delete this._homeRoute;
    delete this._browserRoutes;
    if (this._refreshSubscription) {
      this._refreshSubscription.remove();
    }
  }

  componentWillReceiveProps(nextProps) {
    this._updateNavigator(nextProps);
  }

  render() {
    let initialRouteStack = (this.props.isShell) ? [this._findOrCreateBrowserRoute(this.props.shellManifestUrl)] : [this._homeRoute];

    return (
      <View
        style={styles.container}
        onMoveShouldSetResponderCapture={this._onContainerMoveShouldSetResponderCapture}
        onStartShouldSetResponder={this._onContainerStartShouldSetResponder}
        onResponderGrant={this._onContainerResponderGrant}
        onResponderMove={this._onContainerResponderMove}
        onResponderRelease={this._onContainerResponderRelease}>
        <ExNavigator
          ref={component => { this._navigator = component; }}
          initialRouteStack={initialRouteStack}
          showNavigationBar={false}
          style={styles.navigator}
          sceneStyle={styles.scene}
        />
      </View>
    );
  }

  @autobind
  _onContainerMoveShouldSetResponderCapture(event) {
    // if the force touch gesture is available/meaningful,
    // and user force touches on a subview that would otherwise capture the touch,
    // override that and become the responder.
    if (this._onContainerStartShouldSetResponder()) {
      if (View.forceTouchAvailable) {
        let { force } = event.nativeEvent;
        return (force > 0.8);
      }
    }
    return false;
  }

  @autobind
  _onContainerStartShouldSetResponder() {
    return (!this.props.isShell && this.props.tasks.size > 0);
  }

  @autobind
  _onContainerResponderGrant(event) {
    this._hasTouch = true;
    this._handleTouch(event);
  }

  @autobind
  _onContainerResponderMove(event) {
    this._handleTouch(event);
  }

  @autobind
  _onContainerResponderRelease(event) {
    this._hasTouch = false;
    this._hasDoubleTouch = false;
  }

  @autobind
  _handleTouch(event) {
    let { force, touches } = event.nativeEvent;
    if (this._hasTouch) {
      if (View.forceTouchAvailable) {
        if (force >= 0.99) {
          this._switchTasks();
        }
      }
      if (touches) {
        if (touches.length === 2 && !this._hasDoubleTouch) {
          this._hasDoubleTouch = true;
          this.setTimeout(() => {
            if (this._hasDoubleTouch) {
              this._switchTasks();
            }
          }, 600);
        }
        if (touches.length !== 2 && this._hasDoubleTouch) {
          this._hasDoubleTouch = false;
        }
      }
    }
  }

  @autobind
  _switchTasks() {
    this._hasTouch = false;
    this._hasDoubleTouch = false;
    if (this.props.isHomeVisible) {
      // since only one task besides Home is allowed, just pick the first nonnull url
      let urlsToForeground = this.props.tasks.keySeq().filter(taskUrl => (taskUrl !== null));
      if (urlsToForeground) {
        this.props.dispatch(BrowserActions.foregroundUrlAsync(urlsToForeground.first()));
      }
    } else {
      this.props.dispatch(BrowserActions.foregroundHomeAsync());
    }
  }

  @autobind
  _foregroundTask(event) {
    let { taskUrl } = event;
    let matchingUrlTasks = this.props.tasks.keySeq().filter(url => (url === taskUrl));
    if (matchingUrlTasks) {
      this.props.dispatch(BrowserActions.foregroundUrlAsync(matchingUrlTasks.first()));
    }
  }

  _updateNavigator(nextProps) {
    // present the console if something happened in it
    let isBrowserChanged = false;
    if (this._shouldPushConsoleFromNextProps(nextProps)) {
        this.pushConsole(!this._isCurrentTaskDev());
    } else if (nextProps.foregroundTaskUrl !== this.props.foregroundTaskUrl) {
      if (nextProps.foregroundTaskUrl) {
        this.props.dispatch(ConsoleActions.clearConsole());
      }
      isBrowserChanged = true;
    } else {
      // same url but possibly new time (i.e. the user opened it again)
      let prevTime = (this.props.history && this.props.history.size) ? this.props.history.get(0).get('time') : 0;
      let nextTime = (nextProps.history && nextProps.history.size) ? nextProps.history.get(0).get('time') : 0;
      if (prevTime !== nextTime && nextTime !== 0) {
        isBrowserChanged = true;
      } else if (nextProps.isHomeVisible !== this.props.isHomeVisible) {
        isBrowserChanged = true;
      }
    }

    if (isBrowserChanged) {
      let prevUrl = this.props.foregroundTaskUrl;
      if (nextProps.isHomeVisible || !nextProps.foregroundTaskUrl) {
        requestAnimationFrame(() => this._foregroundHome(prevUrl));
      } else {
        let newUrl = nextProps.foregroundTaskUrl;
        let urlToBackground;
        if (prevUrl !== newUrl && !this.props.isHomeVisible) {
          urlToBackground = prevUrl;
        }
        requestAnimationFrame(() => this._foregroundRouteForUrl(newUrl, urlToBackground));
      }
    }
  }

  _foregroundRouteForUrl(url, urlToBackground) {
    let routeToForeground = this._findOrCreateBrowserRoute(url);
    let currentRoutes = this._navigator.getCurrentRoutes();
    if (currentRoutes.indexOf(routeToForeground) !== -1) {
      this.props.dispatch(BrowserActions.setKernelLoadingState(false));
      this._navigator.jumpTo(routeToForeground);
    } else {
      this._cleanUnusedBrowserRoutes();
      this._navigator.push(routeToForeground);
    }
    ExponentKernel.routeDidForeground(KERNEL_ROUTE_BROWSER, { url, urlToBackground });
  }

  _foregroundHome(urlToBackground) {
    this._navigator.jumpTo(this._homeRoute);
    ExponentKernel.routeDidForeground(KERNEL_ROUTE_HOME, { urlToBackground });
  }

  _findOrCreateBrowserRoute(url) {
    if (this._browserRoutes[url]) {
      return this._browserRoutes[url];
    } else {
      let newRoute = ExRouter.getBrowserRoute(url);
      this._browserRoutes[url] = newRoute;
      return newRoute;
    }
  }

  _cleanUnusedBrowserRoutes() {
    let newBrowserRoutes = {};
    for (let key in this._browserRoutes) {
      if (this._browserRoutes.hasOwnProperty(key)) {
        let url = key;
        let matchingTasks = this.props.tasks.keySeq().filter(taskUrl => (taskUrl === url)).toList();
        if (matchingTasks && matchingTasks.size) {
          newBrowserRoutes[url] = this._browserRoutes[url];
        }
      }
    }
    this._browserRoutes = newBrowserRoutes;
  }

  /**
   *  @param isUserFacing: if true, console should show a end-user-readable "oops" message
   *    overlaying the technical details of the console.
   */
  @autobind
  pushConsole(isUserFacing) {
    let currentRoute = this._navigator.navigationContext.currentRoute;
    let currentRoutes = this._navigator.getCurrentRoutes();
    let currentIndex = currentRoutes.findIndex(route => route === currentRoute);
    let isConsolePresented = currentRoutes
      .slice(0, currentIndex + 1)
      .some(route => route.isConsole);
    if (!isConsolePresented) {
      this._navigator.push(ExRouter.getConsoleRoute(Browser.refresh, isUserFacing));
    }
  }

  _shouldPushConsoleFromNextProps(nextProps) {
    let currentConsoleSize = this.props.consoleHistory ? this.props.consoleHistory.size : 0;
    let newConsoleSize = nextProps.consoleHistory ? nextProps.consoleHistory.size : 0;
    if (newConsoleSize > currentConsoleSize) {
      // current behavior: Pop the console if the error was fatal and we're NOT developing (so no redbox happened).
      // TODO: user accounts: Additionally pop the console if the logged in user owns this experience.
      return this._isLastConsoleItemFatal(nextProps.consoleHistory) && !this._isCurrentTaskDev();
    }
    return false;
  }

  _isCurrentTaskDev() {
    let currentExperience = this.props.tasks.get(this.props.foregroundTaskUrl);
    return currentExperience &&
      currentExperience.manifest &&
      currentExperience.manifest.get('developer');
  }

  _isLastConsoleItemFatal(consoleHistory) {
    consoleHistory = consoleHistory || this.props.consoleHistory;
    if (consoleHistory) {
      let lastConsoleItem = consoleHistory.valueSeq().last();
      return (lastConsoleItem && lastConsoleItem.get('fatal'));
    }
    return false;
  }
}

reactMixin(KernelNavigator.prototype, TimerMixin);

export default connect(
  data => KernelNavigator.getDataProps(data)
)(KernelNavigator);

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigator: {
    backgroundColor: '#1272b6',
  },
  scene: {
    backgroundColor: 'transparent',
  },
});
