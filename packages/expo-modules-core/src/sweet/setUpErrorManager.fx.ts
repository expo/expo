import NativeErrorManager from './NativeErrorManager';
import Platform from '../Platform';
import { CodedError } from '../errors/CodedError';

if (__DEV__ && Platform.OS === 'android' && NativeErrorManager) {
  const onNewException = 'ExpoModulesCoreErrorManager.onNewException';
  const onNewWarning = 'ExpoModulesCoreErrorManager.onNewWarning';

  NativeErrorManager.addListener(onNewException, ({ message }: { message: string }) => {
    console.error(message);
  });

  NativeErrorManager.addListener(onNewWarning, ({ message }: { message: string }) => {
    console.warn(message);
  });
}

declare namespace globalThis {
  let ExpoModulesCore_CodedError: undefined | typeof CodedError;
}

// We have to export `CodedError` via global object to use in later in the C++ code.
globalThis.ExpoModulesCore_CodedError = CodedError;
