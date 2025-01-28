import React from 'react';
import { IOSWebViewProps, AndroidWebViewProps, WindowsWebViewProps } from './WebViewTypes';
export type WebViewProps = IOSWebViewProps & AndroidWebViewProps & WindowsWebViewProps;
declare const WebView: React.FunctionComponent<WebViewProps>;
export { WebView };
export default WebView;
