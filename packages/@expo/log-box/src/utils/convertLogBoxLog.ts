import { LogBoxLog } from '../Data/LogBoxLog';
import { CodeFrame, StackType } from '../Data/Types';
import { parseLogBoxException } from '../Data/parseLogBoxLog';

export function convertToExpoLogBoxLog({
  symbolicated,
  symbolicatedComponentStack,
  codeFrame,
  componentCodeFrame,
  ...log
}: any): LogBoxLog {
  const outputCodeFrame: Partial<Record<StackType, CodeFrame>> = {};

  if (codeFrame) {
    outputCodeFrame.stack = codeFrame;
  }
  if (componentCodeFrame) {
    outputCodeFrame.component = componentCodeFrame;
  }

  const outputSymbolicated = {
    stack: {
      error: null,
      stack: null,
      status: 'NONE',
    },
    component: {
      error: null,
      stack: null,
      status: 'NONE',
    },
  };

  if (symbolicated) {
    outputSymbolicated.stack = symbolicated;
  }
  if (symbolicatedComponentStack) {
    outputSymbolicated.component = {
      error: symbolicatedComponentStack.error,
      // @ts-ignore
      stack: symbolicatedComponentStack.componentStack?.map((frame) => ({
        // From the upstream style (incorrect)
        // {
        //   "fileName": "/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native/Libraries/Components/View/View.js",
        //   "location": { "row": 32, "column": 33 },
        //   "content": "React.forwardRef$argument_0",
        //   "collapse": false
        // },

        // To the stack frame style (correct)
        column: frame.location?.column,
        file: frame.fileName,
        lineNumber: frame.location?.row,
        methodName: frame.content,
        collapse: frame.collapse,
      })),
      status: symbolicatedComponentStack.status,
    };
  }

  return new LogBoxLog({
    ...log,

    codeFrame: outputCodeFrame,
    symbolicated: outputSymbolicated,
  });
}

export function convertNativeToExpoLogBoxLog({ message, stack }: any): LogBoxLog {
  let processedMessage = message;
  let processedStack = stack || [];

  if (processedMessage.startsWith('Unable to load script.')) {
    // Unable to load script native JVM stack is not useful.
    processedStack = [];
  }

  if (process.env.EXPO_DOM_HOST_OS === 'android') {
    try {
      const bodyIndex = processedMessage.indexOf('Body:');
      if (bodyIndex !== -1) {
        const originalJson = processedMessage.slice(bodyIndex + 5);
        if (originalJson) {
          const originalErrorResponseBody = JSON.parse(originalJson);
          processedMessage = originalErrorResponseBody.message;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  const log = new LogBoxLog(
    parseLogBoxException({
      message: processedMessage,
      originalMessage: processedMessage,
      stack: processedStack,
      name: undefined,
      componentStack: undefined,
      id: -1,
      isComponentError: false,
      isFatal: true,
    })
  );
  // Never show stack for native errors, these are typically bundling errors, component stack would lead to LogBox.
  log.componentStack = [];
  return log;
}
