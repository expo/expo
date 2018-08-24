// @flow

import prettyFormat from 'pretty-format';
import { Constants } from 'expo-constants';
import parseErrorStack, {
  type StackFrame,
} from 'react-native/Libraries/Core/Devtools/parseErrorStack';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';

import { type LogData, type LogLevel } from './RemoteLogging';

type SerializedData = {
  body: Array<LogData>,
  includesStack: boolean,
};

export const EXPO_CONSOLE_METHOD_NAME = '__expoConsoleLog';

async function serializeLogDataAsync(data: Array<mixed>, level: LogLevel): Promise<SerializedData> {
  let serializedValues: $ReadOnlyArray<LogData>;
  let includesStack = false;

  if (_stackTraceLogsSupported()) {
    if (_isUnhandledPromiseRejection(data, level)) {
      let rawStack = ((data[0]: any): string);
      let syntheticError = ({ stack: rawStack }: any);
      let stack = await _symbolicateErrorAsync(syntheticError);

      if (!stack.length) {
        serializedValues = _stringifyLogData(data);
      } else {
        // NOTE: This doesn't handle error messages with newlines
        let errorMessage = rawStack.split('\n')[1];
        serializedValues = [
          {
            message: `[Unhandled promise rejection: ${errorMessage}]`,
            stack: _formatStack(stack),
          },
        ];
        includesStack = true;
      }
    } else if (data.length === 1 && data[0] instanceof Error) {
      // When there's only one argument to the log function and that argument is an error, we
      // include the error's stack. If there's more than one argument then we don't include the
      // stack because it's not easy to display nicely in our current UI.

      let serializedError = await _serializeErrorAsync(data[0]);
      serializedValues = [serializedError];
      includesStack = serializedError.hasOwnProperty('stack');
    } else if (level === 'warn' || level === 'error') {
      // For console.warn and console.error it is usually useful to know the stack that leads to the
      // warning or error, so we provide this information to help out with debugging

      let error = _captureConsoleStackTrace();
      // ["hello", "world"] becomes "hello, world"
      let errorMessage = _stringifyLogData(data).join(', ');

      let serializedError = await _serializeErrorAsync(error, errorMessage);
      serializedValues = [serializedError];
      includesStack = serializedError.hasOwnProperty('stack');
    } else {
      serializedValues = _stringifyLogData(data);
    }
  } else {
    serializedValues = _stringifyLogData(data);
  }

  return {
    body: [...serializedValues],
    includesStack,
  };
}

function _stringifyLogData(data: Array<mixed>): Array<string> {
  return data.map(item => {
    if (typeof item === 'string') {
      return item;
    } else {
      return prettyFormat(item);
    }
  });
}

async function _serializeErrorAsync(error: Error, message?: string): Promise<LogData> {
  if (message == null) {
    message = error.message;
  }

  if (!error.stack || !error.stack.length) {
    return prettyFormat(error);
  }

  let stack = await _symbolicateErrorAsync(error);
  let formattedStack = _formatStack(stack);

  return { message, stack: formattedStack };
}

async function _symbolicateErrorAsync(error: Error): Promise<Array<StackFrame>> {
  let parsedStack = parseErrorStack(error);
  let symbolicatedStack: ?Array<StackFrame>;
  try {
    symbolicatedStack = await symbolicateStackTrace(parsedStack);
  } catch (error) {
    return parsedStack;
  }

  // In this context an unsymbolicated stack is better than no stack
  if (!symbolicatedStack) {
    return parsedStack;
  }

  // Clean the stack trace
  return symbolicatedStack.map(_removeProjectRoot);
}

function _formatStack(stack: Array<StackFrame>): string {
  return stack
    .map(frame => {
      let line = `${frame.file}:${frame.lineNumber}`;
      if (frame.column != null) {
        line += `:${frame.column}`;
      }
      line += ` in ${frame.methodName}`;
      return line;
    })
    .join('\n');
}

function _removeProjectRoot(frame: StackFrame): StackFrame {
  let filename = frame.file;
  if (filename == null) {
    return frame;
  }

  let projectRoot = _getProjectRoot();
  if (projectRoot == null) {
    return frame;
  }

  if (filename.startsWith(projectRoot)) {
    filename = filename.substring(projectRoot.length);
    if (filename[0] === '/' || filename[0] === '\\') {
      filename = filename.substring(1);
    }
    frame.file = filename;
  }

  return frame;
}

/**
 * Returns whether the development server that served this project supports logs with a stack trace.
 * Specifically, the version of exp/XDE that includes `projectRoot` in the manifest also accepts
 * payloads of the form:
 *
 * {
 *   includesStack: boolean, body: [{ message: string, stack: string }],
 * }
 */
function _stackTraceLogsSupported(): boolean {
  return !!(__DEV__ && _getProjectRoot());
}

function _isUnhandledPromiseRejection(data: Array<mixed>, level: LogLevel): boolean {
  return (
    level === 'warn' &&
    typeof data[0] === 'string' &&
    /^Possible Unhandled Promise Rejection/.test(data[0])
  );
}

function _captureConsoleStackTrace(): Error {
  try {
    throw new Error();
  } catch (error) {
    let stackLines = error.stack.split('\n');
    let consoleMethodIndex = stackLines.findIndex(frame =>
      frame.includes(EXPO_CONSOLE_METHOD_NAME)
    );
    if (consoleMethodIndex !== -1) {
      stackLines = stackLines.slice(consoleMethodIndex + 1);
      error.stack = stackLines.join('\n');
    }
    return error;
  }
}

function _getProjectRoot(): ?string {
  return Constants.manifest && Constants.manifest.developer
    ? Constants.manifest.developer.projectRoot
    : null;
}

export default {
  serializeLogDataAsync,
};
