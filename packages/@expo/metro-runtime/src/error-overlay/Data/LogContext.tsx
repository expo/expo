import React from 'react';

import { LogBoxLog } from './LogBoxLog';

// Context provider for Array<LogBoxLog>

const IS_TESTING = false;

const FIXTURES = {
  build_error_module_not_found: [
    new LogBoxLog({
      symbolicated: {
        stack: {
          error: null,
          stack: [],
          status: 'COMPLETE',
        },
        component: {
          error: null,
          stack: null,
          status: 'NONE',
        },
      },

      level: 'syntax',
      type: 'error',
      message: {
        content:
          'foobar could not be found within the project or in these directories:\n  node_modules\n  ../../node_modules\n  ../../../node_modules\n  node_modules\n  ../../node_modules',
        substitutions: [],
      },
      stack: [],
      category:
        '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx-1-1',
      componentStack: [],
      codeFrame: {
        fileName:
          '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
        location: null,
        content:
          "\u001b[0m \u001b[90m 1 |\u001b[39m \u001b[36mimport\u001b[39m { \u001b[33mText\u001b[39m\u001b[33m,\u001b[39m \u001b[33mView\u001b[39m } \u001b[36mfrom\u001b[39m \u001b[32m'react-native'\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m 2 |\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 3 |\u001b[39m \u001b[36mimport\u001b[39m \u001b[32m'foobar'\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m   |\u001b[39m         \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 4 |\u001b[39m\n \u001b[90m 5 |\u001b[39m \u001b[36mexport\u001b[39m \u001b[36mdefault\u001b[39m \u001b[36mfunction\u001b[39m \u001b[33mApp\u001b[39m() {\n \u001b[90m 6 |\u001b[39m   \u001b[36mreturn\u001b[39m (\u001b[0m",
      },
      isComponentError: false,
    }),
  ],

  undefined_is_not_a_function_runtime: [
    new LogBoxLog({
      category: 'undefined is not a function',
      componentStack: [],
      isComponentError: false,
      level: 'fatal',
      message: {
        content: 'undefined is not a function',
        substitutions: [],
      },
      symbolicated: {
        stack: {
          error: null,
          stack: [
            {
              arguments: [],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
              lineNumber: 10,
              methodName: 'Text.props.onPress',
              collapse: false,
            },
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/Text/index.js',
              lineNumber: 96,
              methodName: 'handleClick',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16122,
              methodName: 'processDispatchQueue',
              collapse: true,
            },
            {
              arguments: [],
              column: 8,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16725,
              methodName: 'batchedUpdates$1$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: 39,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 3129,
              methodName: 'batchedUpdates$1',
              collapse: true,
            },
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16281,
              methodName: 'dispatchEventForPluginEventSystem',
              collapse: true,
            },
            {
              arguments: [],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 20353,
              methodName: 'dispatchEvent',
              collapse: true,
            },
            {
              arguments: [],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 20321,
              methodName: 'dispatchDiscreteEvent',
              collapse: true,
            },
          ],
          status: 'COMPLETE',
        },
        component: {
          error: null,
          stack: null,
          status: 'NONE',
        },
      },
      type: 'error',
      stack: [
        {
          file: 'http://localhost:8081/apps/router-e2e/__e2e__/05-errors/app/index.bundle//&platform=web&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable&dev=true&minify=false&modulesOnly=true&runModule=false&shallow=true',
          methodName: 'onPress',
          arguments: [],
          lineNumber: 26,
          column: 10,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: '<unknown>',
          arguments: [],
          lineNumber: 30568,
          column: 8,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'processDispatchQueue',
          arguments: [],
          lineNumber: 15359,
          column: 14,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: '<unknown>',
          arguments: [],
          lineNumber: 15656,
          column: 8,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'batchedUpdates$1',
          arguments: [],
          lineNumber: 9027,
          column: 39,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'dispatchEventForPluginEventSystem',
          arguments: [],
          lineNumber: 15439,
          column: 6,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'dispatchEvent',
          arguments: [],
          lineNumber: 17521,
          column: 32,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'dispatchDiscreteEvent',
          arguments: [],
          lineNumber: 17503,
          column: 59,
        },
      ],
      codeFrame: {
        content:
          '\u001b[0m \u001b[90m  8 |\u001b[39m         onPress\u001b[33m=\u001b[39m{() \u001b[33m=>\u001b[39m {\n \u001b[90m  9 |\u001b[39m           \u001b[90m// @ts-expect-error\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 10 |\u001b[39m           undefined()\u001b[33m;\u001b[39m\n \u001b[90m    |\u001b[39m           \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 11 |\u001b[39m         }}\u001b[33m>\u001b[39m\n \u001b[90m 12 |\u001b[39m         \u001b[33mRuntime\u001b[39m error\u001b[33m:\u001b[39m undefined is not a \u001b[36mfunction\u001b[39m\n \u001b[90m 13 |\u001b[39m       \u001b[33m<\u001b[39m\u001b[33m/\u001b[39m\u001b[33mText\u001b[39m\u001b[33m>\u001b[39m\u001b[0m',
        location: {
          row: 10,
          column: 10,
        },
        fileName:
          '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
      },
    }),
  ],
};

export const LogContext = React.createContext<{
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} | null>(null);

export function useLogs(): {
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} {
  const logs = React.useContext(LogContext);
  const nativeError = useNativeErrorInjection();
  if (nativeError) {
    return nativeError;
  }

  if (IS_TESTING) {
    // HACK: This is here for testing during UI development of the LogBox
    return {
      selectedLogIndex: 0,
      isDisabled: false,
      logs: FIXTURES.build_error_module_not_found,
      // logs: FIXTURES.undefined_is_not_a_function_runtime,
    };
  }

  if (!logs) {
    if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
      // Logbox data that is pre-fetched on the dev server and rendered here.
      const expoCliStaticErrorElement = document.getElementById('_expo-static-error');
      if (expoCliStaticErrorElement?.textContent) {
        const raw = JSON.parse(expoCliStaticErrorElement.textContent);
        return {
          ...raw,
          logs: raw.logs.map((raw: any) => new LogBoxLog(raw)),
        };
      } else {
        // Native error boundary.
      }
    }

    throw new Error('useLogs must be used within a LogContext.Provider');
  }
  return logs;
}

const WEBVIEW_BINDINGS = {
  reload() {
    window.webkit.messageHandlers.reload.postMessage(null);
  },
  copy() {
    window.webkit.messageHandlers.copy.postMessage(null);
  },
  dismiss() {
    window.webkit.messageHandlers.dismiss.postMessage(null);
  },
  refresh(): Promise<NativeErrorInfo> {
    return new Promise((resolve) => {
      // Listen for window.dispatchEvent(new CustomEvent(\"$$dom_event\", { detail: errorInfoJson }));
      // from the native side of the webview

      const listener = (event) => {
        const errorInfo = event.detail;
        window.errorInfo = errorInfo;
        window.removeEventListener('$$dom_event', listener);
        resolve(errorInfo);
      };
      window.addEventListener('$$dom_event', listener);
      window.webkit.messageHandlers.refresh.postMessage(null);
    });
  },
};

type NativeErrorInfo = {
  errorMessage: string;
  stack: {
    collapse: boolean;
    column: number;
    file: string;
    lineNumber: number;
    methodName: string;
  }[];
};

function useNativeErrorInjection() {
  const [error, setError] = React.useState<NativeErrorInfo | undefined>(window.errorInfo);
  React.useEffect(() => {
    if (process.env.EXPO_OS !== 'web') {
      return;
    }
    const listener = (event) => {
      const errorInfo = event.detail;
      setError(errorInfo);
      window.removeEventListener('$$dom_event', listener);
    };
    window.addEventListener('$$dom_event', listener);
    if (!window.errorInfo) {
      window.webkit.messageHandlers.refresh.postMessage(null);
    }
    return () => {
      window.removeEventListener('$$dom_event', listener);
    };
  }, []);

  if (!error) {
    return undefined;
  }
  const { errorMessage, stack } = error;

  // Convert to LogBoxLog format
  const logs = stack.map((frame) => ({
    file: frame.file,
    methodName: frame.methodName,
    lineNumber: frame.lineNumber,
    column: frame.column,
    arguments: [],
  }));
  const log = new LogBoxLog({
    level: 'fatal',
    type: 'error',
    message: {
      content: errorMessage,
      substitutions: [],
    },
    stack: logs,
    category: 'NativeError',
    componentStack: [],
    codeFrame: {
      content: errorMessage,
      location: {
        row: 0,
        column: 0,
      },
      fileName: 'NativeError',
    },
    isComponentError: false,
  });
  return {
    selectedLogIndex: 0,
    isDisabled: false,
    logs: [log],
  };
}

export function useSelectedLog() {
  const { selectedLogIndex, logs } = useLogs();
  return logs[selectedLogIndex];
}
