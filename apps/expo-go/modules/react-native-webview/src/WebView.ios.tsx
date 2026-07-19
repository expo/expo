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
import {
  IOSWebViewProps,
  DecelerationRateConstant,
  WebViewSourceUri,
} from './WebViewTypes';

import styles from './WebView.styles';

const { resolveAssetSource } = Image;
const processDecelerationRate = (
  decelerationRate: DecelerationRateConstant | number | undefined
) => {
  let newDecelerationRate = decelerationRate;
  if (newDecelerationRate === 'normal') {
    newDecelerationRate = 0.998;
  } else if (newDecelerationRate === 'fast') {
    newDecelerationRate = 0.99;
  }
  return newDecelerationRate;
};

const useWarnIfChanges = <T extends unknown>(value: T, name: string) => {
  const ref = useRef(value);
  if (ref.current !== value) {
    console.warn(
      `Changes to property ${name} do nothing after the initial render.`
    );
    ref.current = value;
  }
};

const WebViewComponent = forwardRef<{}, IOSWebViewProps>(
  (
    {
      fraudulentWebsiteWarningEnabled = true,
      javaScriptEnabled = true,
      cacheEnabled = true,
      originWhitelist = defaultOriginWhitelist,
      useSharedProcessPool = true,
      textInteractionEnabled = true,
      injectedJavaScript,
      injectedJavaScriptBeforeContentLoaded,
      injectedJavaScriptForMainFrameOnly = true,
      injectedJavaScriptBeforeContentLoadedForMainFrameOnly = true,
      injectedJavaScriptObject,
      startInLoadingState,
      onNavigationStateChange,
      onLoadStart,
      onError,
      onLoad,
      onLoadEnd,
      onLoadProgress,
      onContentProcessDidTerminate: onContentProcessDidTerminateProp,
      onFileDownload,
      onHttpError: onHttpErrorProp,
      onMessage: onMessageProp,
      onOpenWindow: onOpenWindowProp,
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
      dataDetectorTypes,
      incognito,
      decelerationRate: decelerationRateProp,
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
          shouldStart,
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
      onOpenWindow,
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
      onOpenWindowProp,
      startInLoadingState,
      originWhitelist,
      onShouldStartLoadWithRequestProp,
      onShouldStartLoadWithRequestCallback,
      onContentProcessDidTerminateProp,
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
        clearCache: (includeDiskFiles: boolean) =>
          webViewRef.current &&
          Commands.clearCache(webViewRef.current, includeDiskFiles),
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
    useWarnIfChanges(dataDetectorTypes, 'dataDetectorTypes');

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
        lastErrorEvent?.code ?? 0,
        lastErrorEvent?.description ?? ''
      );
    } else if (viewState !== 'IDLE') {
      console.error(`RNCWebView invalid state encountered: ${viewState}`);
    }

    const webViewStyles = [styles.container, styles.webView, style];
    const webViewContainerStyle = [styles.container, containerStyle];

    const decelerationRate = processDecelerationRate(decelerationRateProp);

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
        fraudulentWebsiteWarningEnabled={fraudulentWebsiteWarningEnabled}
        javaScriptEnabled={javaScriptEnabled}
        cacheEnabled={cacheEnabled}
        useSharedProcessPool={useSharedProcessPool}
        textInteractionEnabled={textInteractionEnabled}
        decelerationRate={decelerationRate}
        messagingEnabled={typeof onMessageProp === 'function'}
        messagingModuleName="" // android ONLY
        onLoadingError={onLoadingError}
        onLoadingFinish={onLoadingFinish}
        onLoadingProgress={onLoadingProgress}
        onFileDownload={onFileDownload}
        onLoadingStart={onLoadingStart}
        onHttpError={onHttpError}
        onMessage={onMessage}
        onOpenWindow={onOpenWindowProp && onOpenWindow}
        hasOnOpenWindowEvent={onOpenWindowProp !== undefined}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onContentProcessDidTerminate={onContentProcessDidTerminate}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={
          injectedJavaScriptBeforeContentLoaded
        }
        injectedJavaScriptForMainFrameOnly={injectedJavaScriptForMainFrameOnly}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly
        }
        injectedJavaScriptObject={JSON.stringify(injectedJavaScriptObject)}
        dataDetectorTypes={
          !dataDetectorTypes || Array.isArray(dataDetectorTypes)
            ? dataDetectorTypes
            : [dataDetectorTypes]
        }
        allowsAirPlayForMediaPlayback={allowsAirPlayForMediaPlayback}
        allowsInlineMediaPlayback={allowsInlineMediaPlayback}
        allowsPictureInPictureMediaPlayback={
          allowsPictureInPictureMediaPlayback
        }
        incognito={incognito}
        mediaPlaybackRequiresUserAction={mediaPlaybackRequiresUserAction}
        newSource={newSource}
        style={webViewStyles}
        hasOnFileDownload={!!onFileDownload}
        ref={webViewRef}
        // @ts-expect-error old arch only
        source={sourceResolved}
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

// no native implementation for iOS, depends only on permissions
const isFileUploadSupported: () => Promise<boolean> = async () => true;

const WebView = Object.assign(WebViewComponent, { isFileUploadSupported });

export default WebView;
