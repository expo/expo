/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DeviceEventEmitter } from 'react-native-web';

// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message: string, _type: 'load' | 'refresh') {
  DeviceEventEmitter.emit('devLoadingView:showMessage', {
    message,
  });
}

function hide() {
  DeviceEventEmitter.emit('devLoadingView:hide', {});
}

export default {
  showMessage,
  hide,
};
