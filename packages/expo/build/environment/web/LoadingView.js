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
function dismissBuildError() {
    // TODO(EvanBacon): Add a proper dismiss build error from react-error-overlay
    // in RN they use LogBox but this is too heavy for web (and also native).
    // console.clear();
}
export default {
    showMessage,
    hide,
    dismissBuildError,
};
//# sourceMappingURL=LoadingView.js.map