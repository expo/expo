/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Portions copyright for react-native-windows:
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { View, Image, ImageSourcePropType, NativeModules } from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import invariant from 'invariant';
import { RCTWebView, RCTWebView2 } from './WebViewNativeComponent.windows';
import {
  useWebViewLogic,
  defaultOriginWhitelist,
  defaultRenderError,
  defaultRenderLoading,
} from './WebViewShared';
import { NativeWebViewWindows, WindowsWebViewProps } from './WebViewTypes';

import styles from './WebView.styles';

const Commands = codegenNativeCommands({
  supportedCommands: [
    'goBack',
    'goForward',
    'reload',
    'stopLoading',
    'injectJavaScript',
    'requestFocus',
    'clearCache',
    'postMessage',
    'loadUrl',
  ],
});
const { resolveAssetSource } = Image;

const WebViewComponent = forwardRef<{}, WindowsWebViewProps>(
  (
    {
      cacheEnabled = true,
      originWhitelist = defaultOriginWhitelist,
      startInLoadingState,
      onNavigationStateChange,
      onLoadStart,
      onError,
      onLoad,
      onLoadEnd,
      onLoadProgress,
      onOpenWindow: onOpenWindowProp,
      onSourceChanged,
      onHttpError: onHttpErrorProp,
      onMessage: onMessageProp,
      renderLoading,
      renderError,
      style,
      containerStyle,
      source,
      nativeConfig,
      onShouldStartLoadWithRequest: onShouldStartLoadWithRequestProp,
      useWebView2,
      ...otherProps
    },
    ref
  ) => {
    const webViewRef = useRef<NativeWebViewWindows | null>(null);

    const RCTWebViewString = useWebView2 ? 'RCTWebView2' : 'RCTWebView';

    const onShouldStartLoadWithRequestCallback = useCallback(
      (shouldStart: boolean, url: string, lockIdentifier?: number) => {
        if (lockIdentifier) {
          if (RCTWebViewString === 'RCTWebView') {
            NativeModules.RCTWebView.onShouldStartLoadWithRequestCallback(
              shouldStart,
              lockIdentifier
            );
          } else {
            NativeModules.RCTWebView2.onShouldStartLoadWithRequestCallback(
              shouldStart,
              lockIdentifier
            );
          }
        } else if (shouldStart) {
          Commands.loadUrl(webViewRef, url);
        }
      },
      [RCTWebViewString]
    );

    const {
      onLoadingStart,
      onShouldStartLoadWithRequest,
      onMessage,
      viewState,
      setViewState,
      lastErrorEvent,
      onHttpError,
      onLoadingError,
      onLoadingFinish,
      onLoadingProgress,
      onOpenWindow,
    } = useWebViewLogic({
      onNavigationStateChange,
      onLoad,
      onError,
      onHttpErrorProp,
      onLoadEnd,
      onLoadProgress,
      onLoadStart,
      onMessageProp,
      startInLoadingState,
      originWhitelist,
      onShouldStartLoadWithRequestProp,
      onShouldStartLoadWithRequestCallback,
      onOpenWindowProp,
    });

    useImperativeHandle(
      ref,
      () => ({
        goForward: () => Commands.goForward(webViewRef.current),
        goBack: () => Commands.goBack(webViewRef.current),
        reload: () => {
          setViewState('LOADING');
          Commands.reload(webViewRef.current);
        },
        stopLoading: () => Commands.stopLoading(webViewRef.current),
        postMessage: (data: string) =>
          Commands.postMessage(webViewRef.current, data),
        injectJavaScript: (data: string) =>
          Commands.injectJavaScript(webViewRef.current, data),
        requestFocus: () => Commands.requestFocus(webViewRef.current),
        clearCache: () => Commands.clearCache(webViewRef.current),
        loadUrl: (url: string) => Commands.loadUrl(webViewRef.current, url),
      }),
      [setViewState, webViewRef]
    );

    let otherView = null;
    if (viewState === 'LOADING') {
      otherView = (renderLoading || defaultRenderLoading)();
    } else if (viewState === 'ERROR') {
      invariant(
        lastErrorEvent != null,
        'lastErrorEvent expected to be non-null'
      );
      otherView = (renderError || defaultRenderError)(
        lastErrorEvent.domain,
        lastErrorEvent.code,
        lastErrorEvent.description
      );
    } else if (viewState !== 'IDLE') {
      console.error(`RNCWebView invalid state encountered: ${viewState}`);
    }

    const webViewStyles = [styles.container, styles.webView, style];
    const webViewContainerStyle = [styles.container, containerStyle];

    const NativeWebView = useWebView2 ? RCTWebView2 : RCTWebView;

    const webView = (
      <NativeWebView
        key="webViewKey"
        {...otherProps}
        messagingEnabled={typeof onMessageProp === 'function'}
        linkHandlingEnabled={typeof onOpenWindowProp === 'function'}
        onLoadingError={onLoadingError}
        onLoadingFinish={onLoadingFinish}
        onLoadingProgress={onLoadingProgress}
        onLoadingStart={onLoadingStart}
        onHttpError={onHttpError}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onOpenWindow={onOpenWindow}
        onSourceChanged={onSourceChanged}
        ref={webViewRef}
        // TODO: find a better way to type this.
        source={resolveAssetSource(source as ImageSourcePropType)}
        style={webViewStyles}
        cacheEnabled={cacheEnabled}
        {...nativeConfig?.props}
      />
    );

    return (
      <View style={webViewContainerStyle}>
        {webView}
        {otherView}
      </View>
    );
  }
);

// native implementation should return "true" only for Android 5+
const isFileUploadSupported: () => Promise<boolean> = async () => false;

const WebView = Object.assign(WebViewComponent, { isFileUploadSupported });

export default WebView;
