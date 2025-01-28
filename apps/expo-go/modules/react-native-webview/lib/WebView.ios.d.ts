import React from 'react';
import { IOSWebViewProps } from './WebViewTypes';
declare const WebView: React.ForwardRefExoticComponent<IOSWebViewProps & React.RefAttributes<{}>> & {
    isFileUploadSupported: () => Promise<boolean>;
};
export default WebView;
