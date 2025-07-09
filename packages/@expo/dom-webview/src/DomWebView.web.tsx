import * as React from 'react';
import { View } from 'react-native';

import { DomWebViewProps } from './DomWebView.types';
import { webviewStyles } from './styles';

const WebView = React.forwardRef<object, DomWebViewProps>(
  ({ containerStyle, style, ...props }, ref) => {
    const viewRef = React.useRef(null);

    const webViewStyles = [webviewStyles.container, webviewStyles.webView, style];
    const webViewContainerStyle = [webviewStyles.container, containerStyle];

    return (
      <View style={webViewContainerStyle}>
        <View {...props} ref={viewRef} style={webViewStyles}>
          <iframe src={props.source.uri} />
        </View>
      </View>
    );
  }
);

export default WebView;
