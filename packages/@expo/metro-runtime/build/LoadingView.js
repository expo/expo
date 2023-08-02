import { SyntheticPlatformEmitter } from 'expo-modules-core';
// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message, type) {
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
//# sourceMappingURL=LoadingView.js.map