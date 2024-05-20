import NativeErrorManager from './NativeErrorManager';
import Platform from '../Platform';
import { CodedError } from '../errors/CodedError';
if (__DEV__ && Platform.OS === 'android' && NativeErrorManager) {
    const onNewException = 'ExpoModulesCoreErrorManager.onNewException';
    const onNewWarning = 'ExpoModulesCoreErrorManager.onNewWarning';
    NativeErrorManager.addListener(onNewException, ({ message }) => {
        console.error(message);
    });
    NativeErrorManager.addListener(onNewWarning, ({ message }) => {
        console.warn(message);
    });
}
// We have to export `CodedError` via global object to use in later in the C++ code.
globalThis.ExpoModulesCore_CodedError = CodedError;
//# sourceMappingURL=setUpErrorManager.fx.js.map