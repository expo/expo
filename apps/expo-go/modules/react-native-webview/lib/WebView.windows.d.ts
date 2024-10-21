/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Portions copyright for react-native-windows:
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import React from 'react';
import { WindowsWebViewProps } from './WebViewTypes';
declare const WebView: React.ForwardRefExoticComponent<WindowsWebViewProps & React.RefAttributes<{}>> & {
    isFileUploadSupported: () => Promise<boolean>;
};
export default WebView;
