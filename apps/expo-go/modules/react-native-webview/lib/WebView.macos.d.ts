import React from 'react';

import { MacOSWebViewProps } from './WebViewTypes';
declare const WebView: React.ForwardRefExoticComponent<
  MacOSWebViewProps & React.RefAttributes<unknown>
> & {
  isFileUploadSupported: () => Promise<boolean>;
};
export default WebView;
