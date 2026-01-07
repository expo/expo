import escapeStringRegexp from 'escape-string-regexp';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, View, ActivityIndicator, Text, Platform } from 'react-native';
import {
  OnShouldStartLoadWithRequest,
  ShouldStartLoadRequestEvent,
  WebViewError,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewNavigationEvent,
  WebViewOpenWindowEvent,
  WebViewProgressEvent,
  WebViewRenderProcessGoneEvent,
  WebViewTerminatedEvent,
} from './WebViewTypes';
import styles from './WebView.styles';

const defaultOriginWhitelist = ['http://*', 'https://*'] as const;

const extractOrigin = (url: string): string => {
  const result = /^[A-Za-z][A-Za-z0-9+\-.]+:(\/\/)?[^/]*/.exec(url);
  return result === null ? '' : result[0];
};

const originWhitelistToRegex = (originWhitelist: string): string =>
  `^${escapeStringRegexp(originWhitelist).replace(/\\\*/g, '.*')}`;

const passesWhitelist = (compiledWhitelist: readonly string[], url: string) => {
  const origin = extractOrigin(url);
  return compiledWhitelist.some((x) => new RegExp(x).test(origin));
};

const compileWhitelist = (
  originWhitelist: readonly string[]
): readonly string[] =>
  ['about:blank', ...(originWhitelist || [])].map(originWhitelistToRegex);

const createOnShouldStartLoadWithRequest = (
  loadRequest: (
    shouldStart: boolean,
    url: string,
    lockIdentifier: number
  ) => void,
  originWhitelist: readonly string[],
  onShouldStartLoadWithRequest?: OnShouldStartLoadWithRequest
) => {
  return ({ nativeEvent }: ShouldStartLoadRequestEvent) => {
    let shouldStart = true;
    const { url, lockIdentifier } = nativeEvent;

    if (!passesWhitelist(compileWhitelist(originWhitelist), url)) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          }
          console.warn(`Can't open url: ${url}`);
          return undefined;
        })
        .catch((e) => {
          console.warn('Error opening URL: ', e);
        });
      shouldStart = false;
    } else if (onShouldStartLoadWithRequest) {
      shouldStart = onShouldStartLoadWithRequest(nativeEvent);
    }

    loadRequest(shouldStart, url, lockIdentifier);
  };
};

const defaultRenderLoading = () => (
  <View style={styles.loadingOrErrorView}>
    <ActivityIndicator />
  </View>
);
const defaultRenderError = (
  errorDomain: string | undefined,
  errorCode: number,
  errorDesc: string
) => (
  <View style={styles.loadingOrErrorView}>
    <Text style={styles.errorTextTitle}>Error loading page</Text>
    <Text style={styles.errorText}>{`Domain: ${errorDomain}`}</Text>
    <Text style={styles.errorText}>{`Error Code: ${errorCode}`}</Text>
    <Text style={styles.errorText}>{`Description: ${errorDesc}`}</Text>
  </View>
);

export {
  defaultOriginWhitelist,
  createOnShouldStartLoadWithRequest,
  defaultRenderLoading,
  defaultRenderError,
};

export const useWebViewLogic = ({
  startInLoadingState,
  onNavigationStateChange,
  onLoadStart,
  onLoad,
  onLoadProgress,
  onLoadEnd,
  onError,
  onLoadSubResourceError,
  onHttpErrorProp,
  onMessageProp,
  onOpenWindowProp,
  onRenderProcessGoneProp,
  onContentProcessDidTerminateProp,
  originWhitelist,
  onShouldStartLoadWithRequestProp,
  onShouldStartLoadWithRequestCallback,
}: {
  startInLoadingState?: boolean;
  onNavigationStateChange?: (event: WebViewNavigation) => void;
  onLoadStart?: (event: WebViewNavigationEvent) => void;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onLoadProgress?: (event: WebViewProgressEvent) => void;
  onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;
  onError?: (event: WebViewErrorEvent) => void;
  onLoadSubResourceError?: (event: WebViewErrorEvent) => void;
  onHttpErrorProp?: (event: WebViewHttpErrorEvent) => void;
  onMessageProp?: (event: WebViewMessageEvent) => void;
  onOpenWindowProp?: (event: WebViewOpenWindowEvent) => void;
  onRenderProcessGoneProp?: (event: WebViewRenderProcessGoneEvent) => void;
  onContentProcessDidTerminateProp?: (event: WebViewTerminatedEvent) => void;
  originWhitelist: readonly string[];
  onShouldStartLoadWithRequestProp?: OnShouldStartLoadWithRequest;
  onShouldStartLoadWithRequestCallback: (
    shouldStart: boolean,
    url: string,
    lockIdentifier?: number | undefined
  ) => void;
}) => {
  const [viewState, setViewState] = useState<'IDLE' | 'LOADING' | 'ERROR'>(
    startInLoadingState ? 'LOADING' : 'IDLE'
  );
  const [lastErrorEvent, setLastErrorEvent] = useState<WebViewError | null>(
    null
  );
  const startUrl = useRef<string | null>(null);

  const updateNavigationState = useCallback(
    (event: WebViewNavigationEvent) => {
      onNavigationStateChange?.(event.nativeEvent);
    },
    [onNavigationStateChange]
  );

  const onLoadingStart = useCallback(
    (event: WebViewNavigationEvent) => {
      // Needed for android
      startUrl.current = event.nativeEvent.url;
      // !Needed for android

      onLoadStart?.(event);
      updateNavigationState(event);
    },
    [onLoadStart, updateNavigationState]
  );

  const onLoadingError = useCallback(
    (event: WebViewErrorEvent) => {
      event.persist();
      if (onError) {
        onError(event);
      } else {
        console.warn('Encountered an error loading page', event.nativeEvent);
      }
      onLoadEnd?.(event);
      if (event.isDefaultPrevented()) {
        return;
      }
      setViewState('ERROR');
      setLastErrorEvent(event.nativeEvent);
    },
    [onError, onLoadEnd]
  );

  const onLoadingSubResourceError = useCallback(
    (event: WebViewErrorEvent) => {
      onLoadSubResourceError?.(event);
    },
    [onLoadSubResourceError]
  );

  const onHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      onHttpErrorProp?.(event);
    },
    [onHttpErrorProp]
  );

  // Android Only
  const onRenderProcessGone = useCallback(
    (event: WebViewRenderProcessGoneEvent) => {
      onRenderProcessGoneProp?.(event);
    },
    [onRenderProcessGoneProp]
  );
  // !Android Only

  // iOS Only
  const onContentProcessDidTerminate = useCallback(
    (event: WebViewTerminatedEvent) => {
      onContentProcessDidTerminateProp?.(event);
    },
    [onContentProcessDidTerminateProp]
  );
  // !iOS Only

  const onLoadingFinish = useCallback(
    (event: WebViewNavigationEvent) => {
      onLoad?.(event);
      onLoadEnd?.(event);
      const {
        nativeEvent: { url },
      } = event;
      // on Android, only if url === startUrl
      if (Platform.OS !== 'android' || url === startUrl.current) {
        setViewState('IDLE');
      }
      // !on Android, only if url === startUrl
      updateNavigationState(event);
    },
    [onLoad, onLoadEnd, updateNavigationState]
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      onMessageProp?.(event);
    },
    [onMessageProp]
  );

  const onLoadingProgress = useCallback(
    (event: WebViewProgressEvent) => {
      const {
        nativeEvent: { progress },
      } = event;
      // patch for Android only
      if (Platform.OS === 'android' && progress === 1) {
        setViewState((prevViewState) =>
          prevViewState === 'LOADING' ? 'IDLE' : prevViewState
        );
      }
      // !patch for Android only
      onLoadProgress?.(event);
    },
    [onLoadProgress]
  );

  const onShouldStartLoadWithRequest = useMemo(
    () =>
      createOnShouldStartLoadWithRequest(
        onShouldStartLoadWithRequestCallback,
        originWhitelist,
        onShouldStartLoadWithRequestProp
      ),
    [
      originWhitelist,
      onShouldStartLoadWithRequestProp,
      onShouldStartLoadWithRequestCallback,
    ]
  );

  const onOpenWindow = useCallback(
    (event: WebViewOpenWindowEvent) => {
      onOpenWindowProp?.(event);
    },
    [onOpenWindowProp]
  );

  return {
    onShouldStartLoadWithRequest,
    onLoadingStart,
    onLoadingProgress,
    onLoadingError,
    onLoadingSubResourceError,
    onLoadingFinish,
    onHttpError,
    onRenderProcessGone,
    onContentProcessDidTerminate,
    onMessage,
    onOpenWindow,
    viewState,
    setViewState,
    lastErrorEvent,
  };
};
