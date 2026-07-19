import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { Image, View, ImageSourcePropType, HostComponent } from 'react-native';
import invariant from 'invariant';
import RNCWebView, { Commands, NativeProps } from './RNCWebViewNativeComponent';
import RNCWebViewModule from './NativeRNCWebViewModule';
import {
  defaultOriginWhitelist,
  defaultRenderError,
  defaultRenderLoading,
  useWebViewLogic,
} from './WebViewShared';
import { MacOSWebViewProps, WebViewSourceUri } from './WebViewTypes';

import styles from './WebView.styles';

const { resolveAssetSource } = Image;

const useWarnIfChanges = <T extends unknown>(value: T, name: string) => {
  const ref = useRef(value);
  if (ref.current !== value) {
    console.warn(
      `Changes to property ${name} do nothing after the initial render.`
    );
    ref.current = value;
  }
};

const WebViewComponent = forwardRef<{}, MacOSWebViewProps>(
  (
    {
      javaScriptEnabled = true,
      cacheEnabled = true,
      originWhitelist = defaultOriginWhitelist,
      useSharedProcessPool = true,
      injectedJavaScript,
      injectedJavaScriptBeforeContentLoaded,
      startInLoadingState,
      onNavigationStateChange,
      onLoadStart,
      onError,
      onLoad,
      onLoadEnd,
      onLoadProgress,
      onHttpError: onHttpErrorProp,
      onMessage: onMessageProp,
      renderLoading,
      renderError,
      style,
      containerStyle,
      source,
      nativeConfig,
      allowsInlineMediaPlayback,
      allowsPictureInPictureMediaPlayback = true,
      allowsAirPlayForMediaPlayback,
      mediaPlaybackRequiresUserAction,
      incognito,
      onShouldStartLoadWithRequest: onShouldStartLoadWithRequestProp,
      ...otherProps
    },
    ref
  ) => {
    const webViewRef = useRef<React.ComponentRef<
      HostComponent<NativeProps>
    > | null>(null);

    const onShouldStartLoadWithRequestCallback = useCallback(
      (shouldStart: boolean, _url: string, lockIdentifier = 0) => {
        RNCWebViewModule.shouldStartLoadWithLockIdentifier(
          !!shouldStart,
          lockIdentifier
        );
      },
      []
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
      onContentProcessDidTerminate,
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
    });

    useImperativeHandle(
      ref,
      () => ({
        goForward: () =>
          webViewRef.current && Commands.goForward(webViewRef.current),
        goBack: () => webViewRef.current && Commands.goBack(webViewRef.current),
        reload: () => {
          setViewState('LOADING');
          if (webViewRef.current) {
            Commands.reload(webViewRef.current);
          }
        },
        stopLoading: () =>
          webViewRef.current && Commands.stopLoading(webViewRef.current),
        postMessage: (data: string) =>
          webViewRef.current && Commands.postMessage(webViewRef.current, data),
        injectJavaScript: (data: string) =>
          webViewRef.current &&
          Commands.injectJavaScript(webViewRef.current, data),
        requestFocus: () =>
          webViewRef.current && Commands.requestFocus(webViewRef.current),
      }),
      [setViewState, webViewRef]
    );

    useWarnIfChanges(allowsInlineMediaPlayback, 'allowsInlineMediaPlayback');
    useWarnIfChanges(
      allowsPictureInPictureMediaPlayback,
      'allowsPictureInPictureMediaPlayback'
    );
    useWarnIfChanges(
      allowsAirPlayForMediaPlayback,
      'allowsAirPlayForMediaPlayback'
    );
    useWarnIfChanges(incognito, 'incognito');
    useWarnIfChanges(
      mediaPlaybackRequiresUserAction,
      'mediaPlaybackRequiresUserAction'
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
        lastErrorEvent?.domain,
        lastErrorEvent?.code || 0,
        lastErrorEvent?.description ?? ''
      );
    } else if (viewState !== 'IDLE') {
      console.error(`RNCWebView invalid state encountered: ${viewState}`);
    }

    const webViewStyles = [styles.container, styles.webView, style];
    const webViewContainerStyle = [styles.container, containerStyle];

    const NativeWebView =
      (nativeConfig?.component as typeof RNCWebView | undefined) || RNCWebView;

    const sourceResolved = resolveAssetSource(source as ImageSourcePropType);
    const newSource =
      typeof sourceResolved === 'object'
        ? Object.entries(sourceResolved as WebViewSourceUri).reduce(
            (prev, [currKey, currValue]) => {
              return {
                ...prev,
                [currKey]:
                  currKey === 'headers' &&
                  currValue &&
                  typeof currValue === 'object'
                    ? Object.entries(currValue).map(([key, value]) => {
                        return {
                          name: key,
                          value,
                        };
                      })
                    : currValue,
              };
            },
            {}
          )
        : sourceResolved;

    const webView = (
      <NativeWebView
        key="webViewKey"
        {...otherProps}
        javaScriptEnabled={javaScriptEnabled}
        cacheEnabled={cacheEnabled}
        useSharedProcessPool={useSharedProcessPool}
        messagingEnabled={typeof onMessageProp === 'function'}
        newSource={newSource}
        onLoadingError={onLoadingError}
        onLoadingFinish={onLoadingFinish}
        onLoadingProgress={onLoadingProgress}
        onLoadingStart={onLoadingStart}
        onHttpError={onHttpError}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onContentProcessDidTerminate={onContentProcessDidTerminate}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={
          injectedJavaScriptBeforeContentLoaded
        }
        allowsAirPlayForMediaPlayback={allowsAirPlayForMediaPlayback}
        allowsInlineMediaPlayback={allowsInlineMediaPlayback}
        allowsPictureInPictureMediaPlayback={
          allowsPictureInPictureMediaPlayback
        }
        incognito={incognito}
        mediaPlaybackRequiresUserAction={mediaPlaybackRequiresUserAction}
        ref={webViewRef}
        // @ts-expect-error old arch only
        source={sourceResolved}
        style={webViewStyles}
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

// no native implementation for macOS, depends only on permissions
const isFileUploadSupported: () => Promise<boolean> = async () => true;

const WebView = Object.assign(WebViewComponent, { isFileUploadSupported });

export default WebView;
