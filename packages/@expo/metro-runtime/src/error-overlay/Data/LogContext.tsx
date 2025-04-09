import React from 'react';

import { LogBoxLog } from './LogBoxLog';

// Context provider for Array<LogBoxLog>

const IS_TESTING = false;

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

  if (IS_TESTING) {
    console.log('USING LOGBOX FIXTURE. INTERACTIONS MAY NOT WORK AS EXPECTED');
    // HACK: This is here for testing during UI development of the LogBox
    return {
      selectedLogIndex: 0,
      isDisabled: false,
      logs: FIXTURES.react_element_type_is_invalid,
      // logs: FIXTURES.react_each_child_in_a_list_should_have_a_unique_key_prop,
      // logs: FIXTURES.build_error_module_not_found,
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
      }
    }

    throw new Error('useLogs must be used within a LogContext.Provider');
  }
  return logs;
}

export function useSelectedLog() {
  const { selectedLogIndex, logs } = useLogs();
  return logs[selectedLogIndex];
}

const FIXTURES = {
  react_each_child_in_a_list_should_have_a_unique_key_prop: [
    new LogBoxLog({
      stack: [],
      componentStack: [],
      level: 'error',
      type: 'error',
      message: {
        content:
          'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `App(./story/code-frame.tsx)`. See https://react.dev/link/warning-keys for more information.',
        substitutions: [
          {
            length: 59,
            offset: 53,
          },
          {
            length: 0,
            offset: 112,
          },
        ],
      },
      category:
        'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://react.dev/link/warning-keys for more information.',
      codeFrame: {
        content:
          "\u001b[0m \u001b[90m  6 |\u001b[39m \u001b[36mexport\u001b[39m \u001b[36mdefault\u001b[39m \u001b[36mfunction\u001b[39m \u001b[33mApp\u001b[39m() {\n \u001b[90m  7 |\u001b[39m   \u001b[36mreturn\u001b[39m (\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m  8 |\u001b[39m     \u001b[33m<\u001b[39m\u001b[33mView\u001b[39m style\u001b[33m=\u001b[39m{{ flex\u001b[33m:\u001b[39m \u001b[35m1\u001b[39m\u001b[33m,\u001b[39m gap\u001b[33m:\u001b[39m \u001b[35m16\u001b[39m\u001b[33m,\u001b[39m backgroundColor\u001b[33m:\u001b[39m \u001b[32m'black'\u001b[39m }}\u001b[33m>\u001b[39m\n \u001b[90m    |\u001b[39m     \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m  9 |\u001b[39m       \u001b[33m<\u001b[39m\u001b[33mView\u001b[39m style\u001b[33m=\u001b[39m{{ borderWidth\u001b[33m:\u001b[39m \u001b[35m1\u001b[39m\u001b[33m,\u001b[39m borderColor\u001b[33m:\u001b[39m \u001b[32m'white'\u001b[39m\u001b[33m,\u001b[39m padding\u001b[33m:\u001b[39m \u001b[35m8\u001b[39m }}\u001b[33m>\u001b[39m\n \u001b[90m 10 |\u001b[39m         \u001b[33m<\u001b[39m\u001b[33mErrorCodeFrame\u001b[39m\n \u001b[90m 11 |\u001b[39m           codeFrame\u001b[33m=\u001b[39m{{\u001b[0m",
        location: {
          row: 8,
          column: 4,
        },
        fileName:
          '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/story/code-frame.tsx',
      },
      isComponentError: false,

      symbolicated: {
        stack: {
          error: null,
          stack: [
            {
              arguments: [],
              column: 29,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/@expo/metro-runtime/src/error-overlay/Data/LogBoxData.tsx',
              lineNumber: 185,
              methodName: 'addLog',
              collapse: true,
            },
            {
              arguments: [],
              column: 19,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/@expo/metro-runtime/src/error-overlay/LogBox.web.ts',
              lineNumber: 164,
              methodName: 'registerError',
              collapse: true,
            },
            {
              arguments: [],
              column: 26,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/@expo/metro-runtime/src/error-overlay/LogBox.web.ts',
              lineNumber: 60,
              methodName: 'console.error',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react/cjs/react-jsx-dev-runtime.development.js',
              lineNumber: 586,
              methodName: 'validateExplicitKey',
              collapse: true,
            },
            {
              arguments: [],
              column: 37,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react/cjs/react-jsx-dev-runtime.development.js',
              lineNumber: 534,
              methodName: 'validateChildKeys',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react/cjs/react-jsx-dev-runtime.development.js',
              lineNumber: 450,
              methodName: 'jsxDEVImpl',
              collapse: true,
            },
            {
              arguments: [],
              column: 13,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react/cjs/react-jsx-dev-runtime.development.js',
              lineNumber: 658,
              methodName: 'exports.jsxDEV',
              collapse: true,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/story/code-frame.tsx',
              lineNumber: 8,
              methodName: 'App',
              collapse: false,
            },
            {
              arguments: [],
              column: 19,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 22428,
              methodName: 'callComponent.reactStackBottomFrame',
              collapse: true,
            },
            {
              arguments: [],
              column: 21,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 5757,
              methodName: 'renderWithHooks',
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
    }),
  ],
  react_element_type_is_invalid: [
    new LogBoxLog({
      level: 'fatal',
      stack: [
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'createFiberFromTypeAndProps',
          arguments: [],
          lineNumber: 14011,
          column: 25,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'createFiberFromElement',
          arguments: [],
          lineNumber: 14022,
          column: 13,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'createChild',
          arguments: [],
          lineNumber: 9930,
          column: 29,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'reconcileChildrenArray',
          arguments: [],
          lineNumber: 10043,
          column: 67,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'reconcileChildFibersImpl',
          arguments: [],
          lineNumber: 10150,
          column: 110,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: '<unknown>',
          arguments: [],
          lineNumber: 10177,
          column: 32,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'reconcileChildren',
          arguments: [],
          lineNumber: 11550,
          column: 48,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'beginWork',
          arguments: [],
          lineNumber: 12321,
          column: 1566,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'runWithFiberInDEV',
          arguments: [],
          lineNumber: 7614,
          column: 15,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'performUnitOfWork',
          arguments: [],
          lineNumber: 14858,
          column: 94,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'workLoopSync',
          arguments: [],
          lineNumber: 14752,
          column: 39,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'renderRootSync',
          arguments: [],
          lineNumber: 14736,
          column: 8,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'performWorkOnRoot',
          arguments: [],
          lineNumber: 14497,
          column: 43,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'performWorkOnRootViaSchedulerTask',
          arguments: [],
          lineNumber: 15299,
          column: 6,
        },
        {
          file: 'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          methodName: 'MessagePort.performWorkUntilDeadline',
          arguments: [],
          lineNumber: 20918,
          column: 47,
        },
      ],
      isComponentError: false,
      componentStack: [
        {
          content: 'div',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'View',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 26,
            row: 27631,
          },
        },
        {
          content: 'App(./story/code-frame.tsx)',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'Suspense',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'Route',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 63719,
          },
        },
        {
          content: 'BaseRoute',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 68661,
          },
        },
        {
          content: 'StaticContainer',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 17,
            row: 50028,
          },
        },
        {
          content: 'EnsureSingleNavigator',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 45778,
          },
        },
        {
          content: 'SceneView',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 49873,
          },
        },
        {
          content: 'PreventRemoveProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 48626,
          },
        },
        {
          content: 'NavigationContent',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 49616,
          },
        },
        {
          content: '<unknown>',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 49632,
          },
        },
        {
          content: 'SlotNavigator',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 49,
            row: 64747,
          },
        },
        {
          content: 'div',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'View',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 26,
            row: 27631,
          },
        },
        {
          content: '<unknown>',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 57945,
          },
        },
        {
          content: 'DefaultNavigator(expo-router/build/views/Navigator.js)',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'Suspense',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'Route',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 63719,
          },
        },
        {
          content: 'BaseRoute',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 68661,
          },
        },
        {
          content: 'StaticContainer',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 17,
            row: 50028,
          },
        },
        {
          content: 'EnsureSingleNavigator',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 45778,
          },
        },
        {
          content: 'SceneView',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 49873,
          },
        },
        {
          content: 'PreventRemoveProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 48626,
          },
        },
        {
          content: 'NavigationContent',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 49616,
          },
        },
        {
          content: '<unknown>',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 49632,
          },
        },
        {
          content: 'Content',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 43803,
          },
        },
        {
          content: 'div',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'View',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 26,
            row: 27631,
          },
        },
        {
          content: 'NativeSafeAreaProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 57801,
          },
        },
        {
          content: 'SafeAreaProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 57668,
          },
        },
        {
          content: 'wrapper',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 43663,
          },
        },
        {
          content: 'ThemeProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 46343,
          },
        },
        {
          content: 'EnsureSingleNavigator',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 45778,
          },
        },
        {
          content: 'BaseNavigationContainer',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 44129,
          },
        },
        {
          content: 'NavigationContainerInner',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 58065,
          },
        },
        {
          content: 'ContextNavigator',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 43708,
          },
        },
        {
          content: 'ExpoRoot',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 13,
            row: 43654,
          },
        },
        {
          content: '_HelmetProvider',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 6,
            row: 74921,
          },
        },
        {
          content: 'App',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'LogBoxStateSubscription',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 8,
            row: 4960,
          },
        },
        {
          content: 'ErrorOverlay',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'withDevTools(ErrorOverlay)',
          collapse: false,
          fileName: '<anonymous>',
          location: {
            column: -1,
            row: -1,
          },
        },
        {
          content: 'AppContainer',
          collapse: false,
          fileName:
            'http://localhost:8081/packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2F05-errors%2Fapp&unstable_transformProfile=hermes-stable',
          location: {
            column: 4,
            row: 53147,
          },
        },
      ],
      category:
        "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.\n\nCheck the render method of `App(./story/code-frame.tsx)`.",
      message: {
        content:
          "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.\n\nCheck the render method of `App(./story/code-frame.tsx)`.",
        substitutions: [],
      },

      symbolicated: {
        stack: {
          error: null,
          stack: [
            {
              arguments: [],
              column: 27,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 13350,
              methodName: 'createFiberFromTypeAndProps',
              collapse: true,
            },
            {
              arguments: [],
              column: 13,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 13364,
              methodName: 'createFiberFromElement',
              collapse: true,
            },
            {
              arguments: [],
              column: 25,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 4658,
              methodName: 'createChild',
              collapse: true,
            },
            {
              arguments: [],
              column: 24,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 4989,
              methodName: 'reconcileChildrenArray',
              collapse: true,
            },
            {
              arguments: [],
              column: 29,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 5311,
              methodName: 'reconcileChildFibersImpl',
              collapse: true,
            },
            {
              arguments: [],
              column: 32,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 5415,
              methodName: '<anonymous>',
              collapse: true,
            },
            {
              arguments: [],
              column: 12,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 7738,
              methodName: 'reconcileChildren',
              collapse: true,
            },
            {
              arguments: [],
              column: 12,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 9951,
              methodName: 'beginWork',
              collapse: true,
            },
            {
              arguments: [],
              column: 15,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 543,
              methodName: 'runWithFiberInDEV',
              collapse: true,
            },
            {
              arguments: [],
              column: 21,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 15044,
              methodName: 'performUnitOfWork',
              collapse: true,
            },
            {
              arguments: [],
              column: 40,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 14870,
              methodName: 'workLoopSync',
              collapse: true,
            },
            {
              arguments: [],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 14850,
              methodName: 'renderRootSync',
              collapse: true,
            },
            {
              arguments: [],
              column: 43,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 14384,
              methodName: 'performWorkOnRoot',
              collapse: true,
            },
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 15931,
              methodName: 'performWorkOnRootViaSchedulerTask',
              collapse: true,
            },
            {
              arguments: [],
              column: 47,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/scheduler/cjs/scheduler.development.js',
              lineNumber: 44,
              methodName: 'performWorkUntilDeadline',
              collapse: true,
            },
          ],
          status: 'COMPLETE',
        },
        component: {
          error: null,
          stack: [
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'div',
              collapse: false,
            },
            {
              arguments: [],
              column: 24,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/View/index.js',
              lineNumber: 35,
              methodName: 'React.forwardRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'App(./story/code-frame.tsx)',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'Suspense',
              collapse: false,
            },
            {
              arguments: [],
              column: 17,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/Route.js',
              lineNumber: 29,
              methodName: 'Route',
              collapse: false,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/useScreens.js',
              lineNumber: 145,
              methodName: 'BaseRoute',
              collapse: false,
            },
            {
              arguments: [],
              column: 15,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/StaticContainer.js',
              lineNumber: 9,
              methodName: 'StaticContainer',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/EnsureSingleNavigator.js',
              lineNumber: 12,
              methodName: 'EnsureSingleNavigator',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/SceneView.js',
              lineNumber: 15,
              methodName: 'SceneView',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/PreventRemoveProvider.js',
              lineNumber: 31,
              methodName: 'PreventRemoveProvider',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/useComponent.js',
              lineNumber: 6,
              methodName: 'NavigationContent',
              collapse: true,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/useComponent.js',
              lineNumber: 22,
              methodName: 'React.useRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: 48,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/views/Navigator.js',
              lineNumber: 89,
              methodName: 'SlotNavigator',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'div',
              collapse: false,
            },
            {
              arguments: [],
              column: 24,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/View/index.js',
              lineNumber: 35,
              methodName: 'React.forwardRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-safe-area-context/lib/module/SafeAreaView.web.js',
              lineNumber: 23,
              methodName: 'React.forwardRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'DefaultNavigator(expo-router/build/views/Navigator.js)',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'Suspense',
              collapse: false,
            },
            {
              arguments: [],
              column: 17,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/Route.js',
              lineNumber: 29,
              methodName: 'Route',
              collapse: false,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/useScreens.js',
              lineNumber: 145,
              methodName: 'BaseRoute',
              collapse: false,
            },
            {
              arguments: [],
              column: 15,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/StaticContainer.js',
              lineNumber: 9,
              methodName: 'StaticContainer',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/EnsureSingleNavigator.js',
              lineNumber: 12,
              methodName: 'EnsureSingleNavigator',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/SceneView.js',
              lineNumber: 15,
              methodName: 'SceneView',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/PreventRemoveProvider.js',
              lineNumber: 31,
              methodName: 'PreventRemoveProvider',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/useComponent.js',
              lineNumber: 6,
              methodName: 'NavigationContent',
              collapse: true,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/useComponent.js',
              lineNumber: 22,
              methodName: 'React.useRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: 19,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/ExpoRoot.js',
              lineNumber: 137,
              methodName: 'Content',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'div',
              collapse: false,
            },
            {
              arguments: [],
              column: 24,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/View/index.js',
              lineNumber: 35,
              methodName: 'React.forwardRef$argument_0',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-safe-area-context/lib/module/NativeSafeAreaProvider.web.js',
              lineNumber: 21,
              methodName: 'NativeSafeAreaProvider',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-safe-area-context/lib/module/SafeAreaContext.js',
              lineNumber: 15,
              methodName: 'SafeAreaProvider',
              collapse: true,
            },
            {
              arguments: [],
              column: 23,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/ExpoRoot.js',
              lineNumber: 56,
              methodName: 'wrapper',
              collapse: false,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/theming/ThemeProvider.js',
              lineNumber: 7,
              methodName: 'ThemeProvider',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/EnsureSingleNavigator.js',
              lineNumber: 12,
              methodName: 'EnsureSingleNavigator',
              collapse: true,
            },
            {
              arguments: [],
              column: 2,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/core/lib/module/BaseNavigationContainer.js',
              lineNumber: 72,
              methodName: 'BaseNavigationContainer',
              collapse: true,
            },
            {
              arguments: [],
              column: 36,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/fork/NavigationContainer.js',
              lineNumber: 32,
              methodName: 'NavigationContainerInner',
              collapse: false,
            },
            {
              arguments: [],
              column: 28,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/ExpoRoot.js',
              lineNumber: 76,
              methodName: 'ContextNavigator',
              collapse: false,
            },
            {
              arguments: [],
              column: 29,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/ExpoRoot.js',
              lineNumber: 50,
              methodName: 'ExpoRoot',
              collapse: false,
            },
            {
              arguments: [],
              column: 4,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/vendor/react-helmet-async/lib/index.js',
              lineNumber: 483,
              methodName: '_HelmetProvider#constructor',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'App',
              collapse: false,
            },
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/packages/@expo/metro-runtime/src/error-overlay/Data/LogBoxData.tsx',
              lineNumber: 365,
              methodName: 'LogBoxStateSubscription#constructor',
              collapse: true,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'ErrorOverlay',
              collapse: false,
            },
            {
              arguments: [],
              column: -1,
              file: '<anonymous>',
              lineNumber: -1,
              methodName: 'withDevTools(ErrorOverlay)',
              collapse: false,
            },
            {
              arguments: [],
              column: null,
              file: '\u0000shim:react-native-web/dist/exports/AppRegistry/AppContainer.js',
              lineNumber: null,
              methodName: 'AppContainer',
              collapse: true,
            },
          ],
          status: 'COMPLETE',
        },
      },
    }),
  ],

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
        content:
          'undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function undefined is not a function ',
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
              arguments: ['foobar'],
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
