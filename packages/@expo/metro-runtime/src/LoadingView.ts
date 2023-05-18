import { SyntheticPlatformEmitter } from 'expo-modules-core';

// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message: string, type: 'load' | 'refresh') {
  SyntheticPlatformEmitter.emit('devLoadingView:showMessage', {
    message,
  });
}

function hide() {
  SyntheticPlatformEmitter.emit('devLoadingView:hide', {});
}

module.exports = {
  showMessage,
  hide,
};

export default {
  showMessage,
  hide,
};
