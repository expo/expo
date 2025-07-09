import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { Image, View } from 'react-native';

import type { DomWebViewProps, DomWebViewRef } from './DomWebView.types';
import { webviewStyles } from './styles';

const { resolveAssetSource } = Image;

const NativeWebView: React.ComponentType<
  React.PropsWithoutRef<DomWebViewProps> & React.RefAttributes<DomWebViewRef>
> = requireNativeViewManager('ExpoDomWebViewModule');

const WebView = React.forwardRef<DomWebViewRef, DomWebViewProps>(
  ({ containerStyle, style, ...props }, ref) => {
    const viewRef = React.useRef<DomWebViewRef>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (params) => viewRef.current?.scrollTo(params),
        injectJavaScript: (script: string) => viewRef.current?.injectJavaScript(script),
      }),
      []
    );

    const webViewStyles = [webviewStyles.container, webviewStyles.webView, style];
    const webViewContainerStyle = [webviewStyles.container, containerStyle];

    const resolvedSource = resolveAssetSource(props.source);

    return (
      <View style={webViewContainerStyle}>
        <NativeWebView {...props} ref={viewRef} source={resolvedSource} style={webViewStyles} />
      </View>
    );
  }
);

export default WebView;
