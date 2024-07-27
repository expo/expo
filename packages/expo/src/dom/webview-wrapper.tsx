// A webview without babel to test faster.
import React from 'react';
import { WebView } from 'react-native-webview';

import { useServer } from './use-server';
import { WebContext } from './web-context';

const RawWebView = React.forwardRef(({ dom, $$source, ...props }: any, ref) => {
  const [webView, setWebView] = React.useState<WebView | null>(null);
  const context = React.useContext(WebContext);
  const onMessage = useServer({ context, props, webView });

  const setRef = React.useCallback((webView: WebView | null) => {
    setWebView(webView);

    if (typeof ref === 'function') {
      ref(webView);
    } else if (ref) {
      ref.current = webView;
    }
  }, []);

  return (
    <WebView
      webviewDebuggingEnabled={__DEV__}
      originWhitelist={['*']}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowsAirPlayForMediaPlayback
      allowsFullscreenVideo
      {...dom}
      ref={setRef}
      source={$$source}
      style={[
        dom?.style
          ? { flex: 1, backgroundColor: 'transparent' }
          : { backgroundColor: 'transparent' },
        dom?.style,
      ]}
      onMessage={(event) => onMessage(event.nativeEvent.data)}
    />
  );
});

export function StyleNoSelect() {
  if (
    // @ts-expect-error: Added via react-native-webview
    typeof window.ReactNativeWebView === 'undefined'
  )
    return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
     body {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
      }
      body * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
      }
    
    `,
      }}
    />
  );
}

export default RawWebView;
