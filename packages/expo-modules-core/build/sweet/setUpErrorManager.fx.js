import { EventEmitter } from '../EventEmitter';
import Platform from '../Platform';
import { CodedError } from '../errors/CodedError';
import NativeErrorManager from './NativeErrorManager';
if (__DEV__ && Platform.OS === 'android' && NativeErrorManager) {
    const onNewException = 'ExpoModulesCoreErrorManager.onNewException';
    const eventEmitter = new EventEmitter(NativeErrorManager);
    eventEmitter.addListener(onNewException, ({ message }) => {
        console.error(message);
    });
}
// We have to export `CodedError` via global object to use in later in the C++ code.
globalThis.ExpoModulesCore_CodedError = CodedError;
//# sourceMappingURL=setUpErrorManager.fx.js.map