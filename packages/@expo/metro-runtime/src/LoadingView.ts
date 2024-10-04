/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticPlatformEmitter from 'expo-modules-core/build/SyntheticPlatformEmitter';

// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message: string, type: 'load' | 'refresh') {
  SyntheticPlatformEmitter.emit('devLoadingView:showMessage', {
    message,
  });
}

function hide() {
  SyntheticPlatformEmitter.emit('devLoadingView:hide', {});
}

export default {
  showMessage,
  hide,
};
