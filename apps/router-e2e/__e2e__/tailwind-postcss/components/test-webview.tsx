// A webview without babel to test faster.
import { WebView, BridgeMessage, useBridge } from 'expo/webview';
import React from 'react';

const outputKey =
  'file://' + process.env.EXPO_PROJECT_ROOT + '/__e2e__/tailwind-postcss/components/thing.tsx';

const proxy = { uri: new URL('/_expo/@iframe?file=' + outputKey, window.location.href).toString() };

const RawWebView = React.forwardRef(({ actions, ...props }, ref) => {
  return React.createElement(WebView, {
    ref,
    source: proxy,
  });
});

export default RawWebView;
