import React from 'react';

const HMRClient = require('react-native/Libraries/Utilities/HMRClient').default;

type ReactWithOwnerStack = typeof React & {
  captureOwnerStack?: () => string | null;
};
const captureOwnerStack = (React as ReactWithOwnerStack).captureOwnerStack;

export function captureStackForServerLogs() {
  const HMRClientLogOriginal = HMRClient.log;

  HMRClient.log = (level: string, data: unknown[]) => {
    // NOTE: Should we print stack trace for warnings as well?
    if (![/*'warn',*/ 'error'].includes(level)) {
      // If the log level is not warn or error, we don't need to capture the stack trace.
      return HMRClientLogOriginal.apply(HMRClient, [level, data]);
    }

    const preventSymbolication = data.some(
      (item) => hasBooleanKey(item, 'preventSymbolication') && item.preventSymbolication
    );
    if (preventSymbolication) {
      // NOTE(krystofwoldrich): Although a generic flag, it's only used for compilation errors for which symbolication will fail.
      // If the error would be send back to metro it would be printed multiple times, once by Metro and once from here.
      // https://github.com/facebook/react-native/blob/a8bc74c0099252cb1d11ad3b80f3deac71dcc0d5/packages/react-native/Libraries/Utilities/HMRClient.js#L367
      return;
    }

    const hasErrorLikeStack = data.some((item) => hasStringKey(item, 'stack'));
    const hasComponentStack = data.some(
      (item) =>
        (typeof item === 'string' && isComponentStack(withoutANSIColorStyles(item))) ||
        (hasStringKey(item, 'message') && isComponentStack(withoutANSIColorStyles(item.message)))
    );

    // This is not an Expo error. It's used only to capture the stack trace of the log call.
    // If you see this, look higher in the stack to find the actual cause.
    const syntheticStack = hasErrorLikeStack ? undefined : captureCurrentStack();
    const componentStack = hasComponentStack ? undefined : captureOwnerStack?.();

    const dataWithStack = [...data];
    if (syntheticStack) {
      dataWithStack.push(syntheticStack);
    } else {
      data.forEach((item) => {
        if (hasStringKey(item, 'stack')) {
          // We have to explicitly push the stack to the data array
          // because otherwise it will be lost by `pretty-format`.
          // TODO: Remove message from the stack to avoid duplication (message from `pretty-format` and from our added stack).
          dataWithStack.push(item.stack);
        }
      });
    }
    if (componentStack) {
      dataWithStack.push(componentStack);
    }

    HMRClientLogOriginal.apply(HMRClient, [level, dataWithStack]);
  };
}

// Based on https://github.com/facebook/react-native/blob/a8bc74c0099252cb1d11ad3b80f3deac71dcc0d5/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js#L447
function withoutANSIColorStyles(message: string): string {
  return message.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

// Based on https://github.com/facebook/react-native/blob/a8bc74c0099252cb1d11ad3b80f3deac71dcc0d5/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js#L214
const RE_COMPONENT_STACK_LINE_OLD = / {4}in/;
const RE_COMPONENT_STACK_LINE_NEW = / {4}at/;
const RE_COMPONENT_STACK_LINE_STACK_FRAME = /@.*\n/;
function isComponentStack(consoleArgument: string) {
  const isOldComponentStackFormat = RE_COMPONENT_STACK_LINE_OLD.test(consoleArgument);
  const isNewComponentStackFormat = RE_COMPONENT_STACK_LINE_NEW.test(consoleArgument);
  const isNewJSCComponentStackFormat = RE_COMPONENT_STACK_LINE_STACK_FRAME.test(consoleArgument);

  return isOldComponentStackFormat || isNewComponentStackFormat || isNewJSCComponentStackFormat;
}

function hasStringKey(obj: unknown, key: string): obj is { [key: string]: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<string, unknown>)[key] === 'string'
  );
}

function hasBooleanKey(obj: unknown, key: string): obj is { [key: string]: boolean } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<string, unknown>)[key] === 'boolean'
  );
}

class NamelessError extends Error {
  name = '';
}
function captureCurrentStack() {
  return new NamelessError().stack;
}
