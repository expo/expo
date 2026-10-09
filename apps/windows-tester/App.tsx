import { useEffect, useState } from 'react';
import { NativeModules, Text, TurboModuleRegistry, View } from 'react-native';

type ExpoTester = {
  add(a: number, b: number): number;
  multiplyAsync(a: number, b: number): Promise<number>;
  scheduleFromBackgroundThread(): Promise<boolean>;
};

declare global {
  var expoTester: ExpoTester | undefined;
}

type Results = Record<string, unknown>;

const installer: any =
  TurboModuleRegistry.get('ExpoWindowsTester') ?? NativeModules.ExpoWindowsTester;

function log(message: string) {
  installer?.log(message);
}

// Reports uncaught errors too, so CI doesn't wait for results that never come.
const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  log(`uncaught error: ${error?.stack ?? error}`);
  installer?.report(JSON.stringify({ uncaughtError: String(error) }));
  defaultErrorHandler(error, isFatal);
});

async function runTests(): Promise<Results> {
  const results: Results = {};
  const check = async (name: string, test: () => unknown) => {
    log(`test: ${name}`);
    try {
      results[name] = await test();
    } catch (error) {
      results[name] = { error: String(error) };
    }
  };

  log(`running tests, installer: ${installer ? 'found' : 'missing'}`);
  await check('install', () => installer?.install() ?? 'module not found');
  await check('add', () => globalThis.expoTester?.add(2, 3));
  await check('multiplyAsync', () => globalThis.expoTester?.multiplyAsync(6, 7));
  await check('scheduleFromBackgroundThread', () =>
    globalThis.expoTester?.scheduleFromBackgroundThread()
  );
  return results;
}

log('bundle loaded');

// Runs when the bundle loads rather than in an effect, so it doesn't depend on rendering.
const testRun = runTests().then((results) => {
  log('reporting');
  installer?.report(JSON.stringify(results));
  return results;
});

export default function App() {
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    testRun.then(setResults);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text>{results ? JSON.stringify(results, null, 2) : 'Running…'}</Text>
    </View>
  );
}
