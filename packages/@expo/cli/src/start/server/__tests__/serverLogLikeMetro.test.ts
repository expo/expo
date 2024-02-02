import { stripAnsi } from '../../../utils/ansi';
import { formatStackLikeMetro, logLikeMetro } from '../serverLogLikeMetro';

const WARN_IN_ROUTER_COMPONENT_FIXTURE = `Error: 
at console.warn (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/serverLogLikeMetro.ts:88:21)
at Component (/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app/index.tsx:6:11)
at renderWithHooks (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5662:16)
at renderIndeterminateComponent (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5735:15)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5950:7)
at renderNodeDestructiveImpl (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6108:11)
at renderNodeDestructive (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6080:14)
at renderForwardRef (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5863:5)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6009:11)
at renderNodeDestructiveImpl (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6108:11)
at renderNodeDestructive (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6080:14)
at renderNode (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6263:12)
at renderSuspenseBoundary (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5595:5)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5998:11)
at renderNodeDestructiveImpl (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6108:11)
at renderNodeDestructive (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6080:14)`;

const ERROR_IN_ROUTER_GLOBAL_SCOPE = `Error: 
at console.logWithStack [as error] (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/serverLogLikeMetro.ts:88:21)
at factory (/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app/index.tsx:5:16)
at loadModuleImplementation (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:342:5)
at guardedLoadModule (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:240:12)
at require (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:127:7)
at Object.get [as ./index.tsx] (/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app?ctx=f5d9e791d457250edfb6132a1ae4b69b5ae248c5:3:53)
at contextModule (/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app?ctx=f5d9e791d457250edfb6132a1ae4b69b5ae248c5:7:15)
at map (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/getRoutes.js:213:32)
at Array.map (<anonymous>)
at contextModuleToFileNodes (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/getRoutes.js:205:25)
at contextModuleToTree (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/getRoutes.js:395:19)
at getExactRoutesInternal (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/getRoutes.js:377:23)
at getRoutes (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/getRoutes.js:284:19)
at RouterStore.initialize (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/global-state/router-store.js:73:51)
at nextCreate (/Users/evanbacon/Documents/GitHub/expo/packages/expo-router/build/global-state/router-store.js:209:46)
at Object.useMemo (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5128:19)`;

const ERROR_IN_ROUTER_GLOBAL_SCOPE_PRODUCTION = ERROR_IN_ROUTER_GLOBAL_SCOPE.replace(
  /packages\/expo-router/g,
  'node_modules/expo-router'
);

const SAFE_AREA_CONTEXT_RNW_WARNING = `Error: 
at console.warn (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/serverLogLikeMetro.ts:88:21)
at Function.compose (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/StyleSheet/index.js:119:13)
at Component (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-safe-area-context/lib/commonjs/SafeAreaContext.js:72:36)
at renderWithHooks (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5662:16)
at renderIndeterminateComponent (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5735:15)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5950:7)
at renderNodeDestructiveImpl (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6108:11)
at renderNodeDestructive (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6080:14)
at renderNode (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6263:12)
at renderHostElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5646:3)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5956:5)
at renderNodeDestructiveImpl (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6108:11)
at renderNodeDestructive (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6080:14)
at renderNode (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:6263:12)
at renderHostElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5646:3)
at renderElement (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:5956:5)
`;
const REACT_NAVIGATION_RNW_WARNING = `Error: 
at console.warn (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/serverLogLikeMetro.ts:88:21)
at warnOnce (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/modules/warnOnce/index.js:24:13)
at preprocess (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/StyleSheet/preprocess.js:159:17)
at compileAndInsertAtomic (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/StyleSheet/index.js:56:34)
at forEach (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/StyleSheet/index.js:99:26)
at Array.forEach (<anonymous>)
at Function.create (/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/StyleSheet/index.js:87:23)
at factory (/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/elements/lib/commonjs/Header/HeaderBackButton.js:130:40)
at loadModuleImplementation (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:342:5)
at guardedLoadModule (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:240:12)
at require (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:127:7)
at factory (/Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/elements/lib/commonjs/index.js:126:48)
at loadModuleImplementation (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:342:5)
at guardedLoadModule (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:240:12)
at require (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/polyfills/require.js:127:7)
at /Users/evanbacon/Documents/GitHub/expo/node_modules/@react-navigation/bottom-tabs/lib/commonjs/views/BottomTabView.js:8:17
`;

const PROJECT_ROOT = '/Users/evanbacon/Documents/GitHub/expo/apps/sandbox';

describe(formatStackLikeMetro, () => {
  [
    { WARN_IN_ROUTER_COMPONENT_FIXTURE },
    { ERROR_IN_ROUTER_GLOBAL_SCOPE },
    { ERROR_IN_ROUTER_GLOBAL_SCOPE_PRODUCTION },
    { SAFE_AREA_CONTEXT_RNW_WARNING },
    { REACT_NAVIGATION_RNW_WARNING },
  ].forEach((fixture) => {
    const [name, stack] = Object.entries(fixture)[0];
    it(`formats stack trace: ${name}`, () => {
      expect(stripAnsi(formatStackLikeMetro(PROJECT_ROOT, stack))).toMatchSnapshot();
    });
  });
});

describe(logLikeMetro, () => {
  it(`logs a basic server log`, () => {
    const log = jest.fn();
    logLikeMetro(log, 'log', 'λ', 'hello');
    expect(log).toBeCalledWith(expect.stringContaining('λ'), 'hello');
  });
});
