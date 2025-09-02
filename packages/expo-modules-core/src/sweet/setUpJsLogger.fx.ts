import NativeJSLogger from './NativeJSLogger';
import Platform from '../Platform';
import { CodedError } from '../errors/CodedError';

type LogListener = {
  action: (...data: any[]) => void;
  eventName: string;
};

if (__DEV__ && (Platform.OS === 'android' || Platform.OS === 'ios') && NativeJSLogger) {
  const onNewException: LogListener = {
    eventName: 'ExpoModulesCoreJSLogger.onNewError',
    action: console.error,
  };

  const onNewWarning: LogListener = {
    eventName: 'ExpoModulesCoreJSLogger.onNewWarning',
    action: console.warn,
  };

  const onNewDebug: LogListener = {
    eventName: 'ExpoModulesCoreJSLogger.onNewDebug',
    action: console.debug,
  };

  const onNewInfo: LogListener = {
    eventName: 'ExpoModulesCoreJSLogger.onNewInfo',
    action: console.info,
  };

  const onNewTrace: LogListener = {
    eventName: 'ExpoModulesCoreJSLogger.onNewTrace',
    action: console.trace,
  };

  const listeners: LogListener[] = [
    onNewException,
    onNewWarning,
    onNewDebug,
    onNewInfo,
    onNewTrace,
  ];

  for (const listener of listeners) {
    NativeJSLogger.addListener(listener.eventName, ({ message }: { message: string }) => {
      listener.action(message);
    });
  }
}

declare namespace globalThis {
  let ExpoModulesCore_CodedError: undefined | typeof CodedError;
}

// We have to export `CodedError` via global object to use in later in the C++ code.
globalThis.ExpoModulesCore_CodedError = CodedError;
