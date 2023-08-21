import { TerminalReporter } from '../TerminalReporter';
import { TerminalReportableEvent } from '../TerminalReporter.types';

function createReporter() {
  const reporter = new TerminalReporter({
    log: jest.fn(),
    persistStatus: jest.fn(),
    status: jest.fn(),
  });
  return reporter;
}

it(`invokes utility transform cache reset function`, () => {
  const reporter = createReporter();
  reporter.transformCacheReset = jest.fn();
  reporter._log({
    type: 'transform_cache_reset',
  });
  expect(reporter.transformCacheReset).toHaveBeenCalled();
});
it(`invokes utility graph loading function`, () => {
  const reporter = createReporter();
  reporter.dependencyGraphLoading = jest.fn();
  reporter._log({
    type: 'dep_graph_loading',
    hasReducedPerformance: true,
  });
  expect(reporter.dependencyGraphLoading).toHaveBeenCalledWith(true);
});
it(`invokes utility filter function`, () => {
  const reporter = createReporter();

  reporter.shouldFilterClientLog = jest.fn();
  const event: TerminalReportableEvent = {
    type: 'client_log',
    level: 'trace',
    data: [],
  };
  reporter._log(event);
  expect(reporter.shouldFilterClientLog).toHaveBeenCalledWith(event);
  expect(reporter.terminal.log).toBeCalled();
});
it(`skips logging if the filter function returns true`, () => {
  const reporter = createReporter();

  reporter.shouldFilterClientLog = jest.fn(() => true);
  const event: TerminalReportableEvent = {
    type: 'client_log',
    level: 'trace',
    data: [],
  };
  reporter._log(event);
  expect(reporter.shouldFilterClientLog).toHaveBeenCalledWith(event);
  expect(reporter.terminal.log).not.toBeCalled();
});

describe('warnings', () => {
  it(`symbolicates warning stack traces`, () => {
    const reporter = createReporter();

    reporter.shouldFilterClientLog = jest.fn();

    const event: TerminalReportableEvent = {
      type: 'client_log',
      level: 'warn',
      data: [
        'You started loading the font "Inter_500Medium", but used it before it finished loading. You need to wait for Font.loadAsync to complete before using the font.',
        '\n' +
          '    at HeaderConfig (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141762:28)\n' +
          '    at RNSScreen\n' +
          '    at anonymous (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:98835:62)\n' +
          '    at Suspender (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141371:22)\n' +
          '    at Suspense\n' +
          '    at Freeze (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141390:23)\n' +
          '    at DelayedFreeze (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:140980:22)\n' +
          '    at InnerScreen (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141028:36)\n' +
          '    at Screen (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141303:36)\n' +
          '    at SceneView (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:139016:22)\n' +
          '    at Suspender (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141371:22)\n' +
          '    at Suspense\n' +
          '    at Freeze (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141390:23)\n' +
          '    at DelayedFreeze (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:140980:22)\n' +
          '    at RNSScreenStack\n' +
          '    at ScreenStack (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141000:25)\n' +
          '    at NativeStackViewInner (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:139197:22)\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at SafeAreaProviderCompat (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:140755:25)\n' +
          '    at NativeStackView\n' +
          '    at PreventRemoveProvider (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:136260:25)\n' +
          '    at NavigationContent (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:137071:22)\n' +
          '    at anonymous (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:137086:27)\n' +
          '    at NativeStackNavigator (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:132149:18)\n' +
          '    at anonymous (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:142023:38)\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at ActionSheet (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:182885:36)\n' +
          '    at ActionSheetProvider (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:182798:36)\n' +
          '    at DynamicIconProvider (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:229093:24)\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at InnerLayout (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:182487:48)\n' +
          '    at AnimatedSplashScreen (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:182638:25)\n' +
          '    at Layout (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:182439:32)\n' +
          '    at Try (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:145843:36)\n' +
          '    at Route (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:142087:24)\n' +
          '    at Route() (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:142393:24)\n' +
          '    at RNCSafeAreaProvider\n' +
          '    at SafeAreaProvider (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:139860:24)\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at GestureHandlerRootView\n' +
          '    at GestureHandlerRootView\n' +
          '    at wrapper (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:152650:27)\n' +
          '    at EnsureSingleNavigator (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:134180:24)\n' +
          '    at BaseNavigationContainer (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:132773:28)\n' +
          '    at ThemeProvider (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:138382:21)\n' +
          '    at NavigationContainerInner (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:152975:26)\n' +
          '    at ContextNavigator (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:152670:24)\n' +
          '    at ExpoRoot (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:152641:30)\n' +
          '    at App\n' +
          '    at withDevTools(App) (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:131384:27)\n' +
          '    at ErrorToastContainer (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:131285:24)\n' +
          '    at ErrorOverlay\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at RCTView\n' +
          '    at View (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40396:43)\n' +
          '    at AppContainer (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40253:36)\n' +
          '    at main(RootComponent) (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:121649:28)',
      ],
      mode: 'BRIDGE',
    };
    reporter._log(event);
    expect(reporter.shouldFilterClientLog).toHaveBeenCalledWith(event);
    expect(reporter.terminal.log).toBeCalled();
  });
});
