import { EventEmitter } from '../EventEmitter';
import Platform from '../Platform';
import { CodedError } from '../errors/CodedError';
import NativeErrorManager from './NativeErrorManager';

if (__DEV__ && Platform.OS === 'android' && NativeErrorManager) {
  const onNewException = 'ExpoModulesCoreErrorManager.onNewException';
  const eventEmitter = new EventEmitter(NativeErrorManager);

  eventEmitter.addListener(onNewException, ({ message }: { message: string }) => {
    console.error(message);
  });
}

// We have to export `CodedError` via global object to use in later in the C++ code.
global.ExpoModulesCore_CodedError = CodedError;
