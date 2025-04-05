import ErrorOverlay, {
  LogBoxInspectorContainer,
} from '@expo/metro-runtime/src/error-overlay/ErrorOverlay';
import { LogContext } from '@expo/metro-runtime/src/error-overlay/Data/LogContext';
// const ErrorOverlay: React.ComponentType = require('../../ErrorOverlay').default;
import LogBox from '@expo/metro-runtime/src/error-overlay/LogBox';
import { LogBoxLog } from '@expo/metro-runtime/src/error-overlay/Data/LogBoxLog';

// TODO: Populate this from the native side too.
window.__expo_override_baseUrl = 'http://localhost:8081';

const WEBVIEW_FIXTURE = JSON.parse(
  '{"stack":[{"lineNumber":103548,"collapse":false,"methodName":"createWebSocketConnection","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":32},{"lineNumber":103557,"collapse":false,"methodName":"anonymous","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":27},{"lineNumber":253,"collapse":false,"methodName":"loadModuleImplementation","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":162,"collapse":false,"methodName":"guardedLoadModule","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":37},{"lineNumber":82,"collapse":false,"methodName":"metroRequire","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":91},{"lineNumber":103538,"collapse":false,"methodName":"anonymous","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":253,"collapse":false,"methodName":"loadModuleImplementation","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":162,"collapse":false,"methodName":"guardedLoadModule","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":37},{"lineNumber":82,"collapse":false,"methodName":"metroRequire","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":91},{"lineNumber":1283,"collapse":false,"methodName":"anonymous","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":9},{"lineNumber":253,"collapse":false,"methodName":"loadModuleImplementation","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":162,"collapse":false,"methodName":"guardedLoadModule","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":37},{"lineNumber":82,"collapse":false,"methodName":"metroRequire","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":91},{"lineNumber":1271,"collapse":false,"methodName":"anonymous","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":9},{"lineNumber":253,"collapse":false,"methodName":"loadModuleImplementation","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":162,"collapse":false,"methodName":"guardedLoadModule","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":37},{"lineNumber":82,"collapse":false,"methodName":"metroRequire","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":91},{"lineNumber":1268,"collapse":false,"methodName":"anonymous","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":9},{"lineNumber":253,"collapse":false,"methodName":"loadModuleImplementation","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":13},{"lineNumber":155,"collapse":false,"methodName":"guardedLoadModule","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":46},{"lineNumber":82,"collapse":false,"methodName":"metroRequire","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":91},{"lineNumber":167850,"collapse":false,"methodName":"global","file":"http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.bacon.apr5-53&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable","column":3}],"errorMessage":"[runtime not ready]: TypeError: getDevServer is not a function (it is Object), js engine: hermes"}'
);

// const WEBVIEW_BINDINGS = {
//   reload() {
//     window.webkit.messageHandlers.reload.postMessage(null);
//   },
//   copy() {
//     window.webkit.messageHandlers.copy.postMessage(null);
//   },
//   dismiss() {
//     window.webkit.messageHandlers.dismiss.postMessage(null);
//   },
//   refresh(): Promise<NativeErrorInfo> {
//     return new Promise((resolve) => {
//       // Listen for window.dispatchEvent(new CustomEvent(\"$$dom_event\", { detail: errorInfoJson }));
//       // from the native side of the webview

//       const listener = (event) => {
//         const errorInfo = event.detail;
//         window.errorInfo = errorInfo;
//         window.removeEventListener('$$dom_event', listener);
//         resolve(errorInfo);
//       };
//       window.addEventListener('$$dom_event', listener);
//       window.webkit.messageHandlers.refresh.postMessage(null);
//     });
//   },
// };

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

// function useNativeErrorInjection() {
//   // TODO: Populate this from the native side too.
//   window.__expo_override_baseUrl = 'http://localhost:8081';

//   // if (IS_TESTING) {
//   return nativeErrorToLogBoxLog(WEBVIEW_FIXTURE);
//   // }

//   const [error, setError] = React.useState<NativeErrorInfo | undefined>(window.errorInfo);

//   React.useEffect(() => {
//     if (process.env.EXPO_OS !== 'web') {
//       return;
//     }
//     const listener = (event) => {
//       const errorInfo = event.detail;
//       window.errorInfo = errorInfo;
//       setError(errorInfo);
//       console.log('errorInfo', errorInfo);
//       window.removeEventListener('$$dom_event', listener);
//     };
//     window.addEventListener('$$dom_event', listener);
//     if (!window.errorInfo) {
//       window.webkit.messageHandlers.refresh.postMessage(null);
//     }
//     return () => {
//       window.removeEventListener('$$dom_event', listener);
//     };
//   }, []);

//   if (!error) {
//     return undefined;
//   }

//   console.log('NATIVE DATA', JSON.stringify(error));
//   return nativeErrorToLogBoxLog(error);
// }

function nativeErrorToLogBoxLog(nativeError: NativeErrorInfo) {
  const { errorMessage, stack } = nativeError;

  // Convert to LogBoxLog format
  const logs = stack.map((frame) => ({
    ...frame,
    file: frame.file,
    methodName: frame.methodName,
    lineNumber: frame.lineNumber,
    column: frame.column,
    // arguments: [],
  }));

  return new LogBoxLog({
    level: 'fatal',
    // type: 'error',
    message: {
      content: errorMessage,
      substitutions: [],
    },

    stack: logs,
    category: 'static',
    // category: 'NativeError',
    componentStack: [],
    // codeFrame: {
    //   content: errorMessage,
    //   location: {
    //     row: 0,
    //     column: 0,
    //   },
    //   fileName: 'NativeError',
    // },
    isComponentError: false,
  });
  // return {
  //   selectedLogIndex: 0,
  //   isDisabled: false,
  //   logs: [log],
  // };
}

import * as LogBoxData from '@expo/metro-runtime/src/error-overlay/Data/LogBoxData';
import { useEffect } from 'react';
// const { parseLogBoxLog, parseInterpolation } =
//   require('./Data/parseLogBoxLog') as typeof import('./Data/parseLogBoxLog');

const log = nativeErrorToLogBoxLog(WEBVIEW_FIXTURE);

console.log('LOG FIXTURE:', log);
LogBoxData.addLog(log);

export default function App() {
  useEffect(() => {
    // Inject an attribute in the HTML to indicate to the CSS that this app is running in a webview
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-webview', 'true');
    }
  }, []);

  return (
    <ErrorOverlay />
    // <LogContext.Provider
    //   value={{
    //     selectedLogIndex: 0,
    //     isDisabled: false,
    //     logs: [],
    //   }}>
    //   <LogBoxInspectorContainer />
    // </LogContext.Provider>
  );
}
