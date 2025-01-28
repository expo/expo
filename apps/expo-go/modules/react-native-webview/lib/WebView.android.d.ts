import React from 'react';
import { AndroidWebViewProps } from './WebViewTypes';
declare const WebView: React.ForwardRefExoticComponent<AndroidWebViewProps & React.RefAttributes<{}>> & {
    isFileUploadSupported: () => Promise<boolean>;
};
export default WebView;
