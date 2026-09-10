import React from 'react';

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
declare const defaultOriginWhitelist: readonly ['http://*', 'https://*'];
declare const createOnShouldStartLoadWithRequest: (
  loadRequest: (shouldStart: boolean, url: string, lockIdentifier: number) => void,
  originWhitelist: readonly string[],
  onShouldStartLoadWithRequest?: OnShouldStartLoadWithRequest
) => ({ nativeEvent }: ShouldStartLoadRequestEvent) => void;
declare const defaultRenderLoading: () => React.JSX.Element;
declare const defaultRenderError: (
  errorDomain: string | undefined,
  errorCode: number,
  errorDesc: string
) => React.JSX.Element;
export {
  defaultOriginWhitelist,
  createOnShouldStartLoadWithRequest,
  defaultRenderLoading,
  defaultRenderError,
};
export declare const useWebViewLogic: ({
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
    lockIdentifier?: number
  ) => void;
}) => {
  onShouldStartLoadWithRequest: ({ nativeEvent }: ShouldStartLoadRequestEvent) => void;
  onLoadingStart: (event: WebViewNavigationEvent) => void;
  onLoadingProgress: (event: WebViewProgressEvent) => void;
  onLoadingError: (event: WebViewErrorEvent) => void;
  onLoadingSubResourceError: (event: WebViewErrorEvent) => void;
  onLoadingFinish: (event: WebViewNavigationEvent) => void;
  onHttpError: (event: WebViewHttpErrorEvent) => void;
  onRenderProcessGone: (event: WebViewRenderProcessGoneEvent) => void;
  onContentProcessDidTerminate: (event: WebViewTerminatedEvent) => void;
  onMessage: (event: WebViewMessageEvent) => void;
  onOpenWindow: (event: WebViewOpenWindowEvent) => void;
  viewState: 'ERROR' | 'IDLE' | 'LOADING';
  setViewState: React.Dispatch<React.SetStateAction<'ERROR' | 'IDLE' | 'LOADING'>>;
  lastErrorEvent: WebViewError | null;
};
