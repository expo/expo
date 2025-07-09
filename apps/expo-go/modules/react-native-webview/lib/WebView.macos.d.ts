import React from 'react';
import { MacOSWebViewProps } from './WebViewTypes';
declare const WebView: React.ForwardRefExoticComponent<MacOSWebViewProps & React.RefAttributes<{}>> & {
    isFileUploadSupported: () => Promise<boolean>;
};
export default WebView;
