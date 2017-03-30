/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule KernelNavigator
 * @flow
 */
'use strict';

import React from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Easing,
  NativeModules,
  StyleSheet,
  View,
} from 'react-native';
import ExNavigator from '@expo/react-native-navigator';
import TimerMixin from 'react-timer-mixin';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ConsoleActions from 'ConsoleActions';
import ExButton from 'ExButton';
import ExRouter from 'ExRouter';
import ExponentKernel from 'ExponentKernel';
import LocalStorage from 'LocalStorage';
import MenuView from 'MenuView';
import reactMixin from 'react-mixin';
import { connect } from 'react-redux';

const {
  ExponentConstants,
} = NativeModules;

const KERNEL_ROUTE_HOME = 0;
const KERNEL_ROUTE_BROWSER = 1;
const FORCE_TOUCH_SWITCH_THRESHOLD = 0.995;
const FORCE_TOUCH_CAPTURE_THRESHOLD = 0.85;

const ENABLE_LEGACY_MENU_BEHAVIOR = false;

const MENU_FADE_IN_TOTAL_MS = 400;
const MENU_FADE_IN_BEGIN_MS = 50; // make this one shorter

class KernelNavigator extends React.Component {
  static getDataProps(data) {
    let {
      isShell,
      shellManifestUrl,
      isHomeVisible,
      isMenuVisible,
      isNuxFinished,
      foregroundTaskUrl,
      tasks,
      history,
    } = data.browser;
    return {
      isShell,
      shellManifestUrl,
      isHomeVisible,
      isMenuVisible,
      isNuxFinished,
      foregroundTaskUrl,
      tasks,
      history,
      consoleHistory: data.console.history,
    };
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      menuTransition: new Animated.Value(0),
      isShowingOverlay: false,
    };
    this.state.menuTransition.addListener((event) => {
      let isShowingOverlay = (event.value > 0);
      if (isShowingOverlay !== this.state.isShowingOverlay) {
        this.setState({ isShowingOverlay });
      }
    });
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
    this._refreshSubscription = Browser.addRefreshListener(async () => {
      // bypass validation of the link and just try to open it again
      if (this.props.isShell) {
        // don't clean browser routes: we'll make a new history item and task for
        // the same url, and the existing route's props will update.
        // don't call ExponentKernel.openURL because we don't want to re-route
        // the existing url. we want to force a reload of the manifest.
        this.props.dispatch(BrowserActions.setKernelLoadingState(true));
        this.props.dispatch(BrowserActions.navigateToUrlAsync(this.props.shellManifestUrl));
      } else if (this.props.foregroundTaskUrl) {
        let urlToRefresh = this.props.foregroundTaskUrl;
        await this.props.dispatch(BrowserActions.foregroundHomeAsync(true));
        this._cleanUnusedBrowserRoutes();
        ExponentKernel.openURL(urlToRefresh);
      }
    });
    DeviceEventEmitter.addListener('ExponentKernel.foregroundTask', this._foregroundTask);
    DeviceEventEmitter.addListener('ExponentKernel.switchTasks', this._handleSwitchTasksEvent);
    this._loadNuxStateAsync();
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
    this._updateMenuFromProps(nextProps);
  }

  render() {
    let { isShell, shellManifestUrl, tasks, foregroundTaskUrl, isHomeVisible, isMenuVisible, isNuxFinished } = this.props;
    let initialRouteStack = (isShell) ? [this._findOrCreateBrowserRoute(shellManifestUrl)] : [this._homeRoute];

    let simulatorButton;
    if (ENABLE_LEGACY_MENU_BEHAVIOR) {
      // EXButton appears for simulators on computers with no force touch
      // because all the gestures are too annoying in this circumstance.
      if (!ExponentConstants.isDevice && tasks.size > 0 && !isShell) {
        // don't show it if the menu is currently on screen.
        if (isHomeVisible || !isMenuVisible || !isNuxFinished) {
          simulatorButton = (<ExButton onPress={this._switchTasks} />);
        }
      }
    }

    let menuView, menuOverlay;
    if (this.state.isShowingOverlay) {
      let backgroundColor = this.state.menuTransition.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.001)', 'rgba(255, 255, 255, 0.9)'],
      });
      menuOverlay = (
        <Animated.View style={[styles.menuOverlay, {backgroundColor}]} />
      );
    }
    if (isMenuVisible) {
      let task = tasks.get(foregroundTaskUrl);
      menuView = (
        <MenuView
          task={task}
          isNuxFinished={isNuxFinished}
          shouldFadeIn
        />
      );
    }

    let responders = {};
    if (ENABLE_LEGACY_MENU_BEHAVIOR) {
      responders = {
        onMoveShouldSetResponderCapture: this._onContainerMoveShouldSetResponderCapture,
        onStartShouldSetResponder: this._onContainerStartShouldSetResponder,
        onResponderGrant: this._onContainerResponderGrant,
        onResponderMove: this._onContainerResponderMove,
        onResponderRelease: this._onContainerResponderRelease,
      }
    }

    return (
      <View
        style={styles.container}
        {...responders}>
        <ExNavigator
          ref={component => { this._navigator = component; }}
          initialRouteStack={initialRouteStack}
          showNavigationBar={false}
          style={styles.navigator}
          sceneStyle={styles.scene}
        />
        {simulatorButton}
        {menuOverlay}
        {menuView}
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
        return (force > FORCE_TOUCH_CAPTURE_THRESHOLD);
      }
    }
    return false;
  }

  @autobind
  _onContainerStartShouldSetResponder() {
    return this._isSwitchTasksAvailable();
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
    this._interruptMenuTransition();
  }

  @autobind
  _handleTouch(event) {
    let { force, touches } = event.nativeEvent;
    if (this._hasTouch) {
      if (View.forceTouchAvailable) {
        if (force >= FORCE_TOUCH_SWITCH_THRESHOLD && touches.length === 2) {
          this._switchTasks();
        }
      } else if (touches) {
        if (touches.length === 2 && !this._hasDoubleTouch) {
          this._hasDoubleTouch = true;
          // quickly start fading in the menu to respond to double touch
          this.setTimeout(() => {
            if (this._hasDoubleTouch) {
              this._transitionMenu(0.75, MENU_FADE_IN_TOTAL_MS - MENU_FADE_IN_BEGIN_MS);
            }
          }, MENU_FADE_IN_BEGIN_MS);
          this.setTimeout(() => {
            if (this._hasDoubleTouch) {
              this._switchTasks();
            }
          }, MENU_FADE_IN_TOTAL_MS);
        }
        if (touches.length !== 2 && this._hasDoubleTouch) {
          this._interruptMenuTransition();
          this._hasDoubleTouch = false;
        }
      }
    }
  }

  _updateMenuFromProps(nextProps) {
    if (nextProps.isMenuVisible) {
      this._transitionMenu(1, 200);
    } else {
      this._transitionMenu(0, 200);
    }
  }

  _interruptMenuTransition() {
    if (!this.props.isMenuVisible) {
      this._transitionMenu(0, 100);
    }
  }

  _transitionMenu(toValue, duration) {
    this.state.menuTransition.stopAnimation(() => {
      Animated.timing(this.state.menuTransition, {
        easing: Easing.inOut(Easing.quad),
        toValue,
        duration,
      }).start();
    });
  }

  _handleSwitchTasksEvent = (_) => {
    if (ENABLE_LEGACY_MENU_BEHAVIOR) {
      // this behavior is not available if the old button/gesture are being used instead
      return;
    }
    if (this._isSwitchTasksAvailable()) {
      this._switchTasks();
    }
  }

  _isSwitchTasksAvailable = () => {
    return (!this.props.isShell && this.props.tasks.size > 0);
  }

  _switchTasks = () => {
    this._hasTouch = false;
    this._hasDoubleTouch = false;
    if (this.props.isHomeVisible) {
      // since only one task besides Home is allowed, just pick the first nonnull url
      let urlsToForeground = this.props.tasks.keySeq().filter(taskUrl => (taskUrl !== null));
      if (urlsToForeground) {
        this.props.dispatch(BrowserActions.foregroundUrlAsync(urlsToForeground.first()));
      }
    } else {
      this.props.dispatch(BrowserActions.showMenuAsync(!this.props.isMenuVisible));
      // this.props.dispatch(BrowserActions.foregroundHomeAsync());
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
          requestAnimationFrame(() => {
            this._foregroundHome(prevUrl);
            this._foregroundRouteForUrl(newUrl, null);
          });
        } else {
          requestAnimationFrame(() => this._foregroundRouteForUrl(newUrl, urlToBackground));
        }
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
    if (this.props.isShell) {
      // there is no home in this case, go back to the root shell task
      this._foregroundRouteForUrl(this.props.shellManifestUrl, urlToBackground);
    } else {
      if (this.isConsolePresented()) {
        this._navigator.pop();
      }
      this._navigator.jumpTo(this._homeRoute);
      ExponentKernel.routeDidForeground(KERNEL_ROUTE_HOME, { urlToBackground });
    }
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

  @autobind
  isConsolePresented() {
    let currentRoute = this._navigator.navigationContext.currentRoute;
    let currentRoutes = this._navigator.getCurrentRoutes();
    let currentIndex = currentRoutes.findIndex(route => route === currentRoute);
    let isConsolePresented = currentRoutes
      .slice(0, currentIndex + 1)
      .some(route => route.isConsole);

    return isConsolePresented;
  }

  /**
   *  @param isUserFacing: if true, console should show a end-user-readable "oops" message
   *    overlaying the technical details of the console.
   */
  @autobind
  pushConsole(isUserFacing) {
    if (!this.isConsolePresented()) {
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

  async _loadNuxStateAsync() {
    // load wherever the previous nux left off
    let isNuxFinished = await LocalStorage.getIsNuxFinishedAsync();
    if (isNuxFinished === 'true') {
      this.props.dispatch(BrowserActions.setIsNuxFinishedAsync(true));
    }

    // listen for kernel nux events
    DeviceEventEmitter.addListener('ExponentKernel.resetNuxState', () => {
      this.props.dispatch(BrowserActions.setIsNuxFinishedAsync(false));
    });
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
  menuOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
});
