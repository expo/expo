import { useTheme } from 'ThemeProvider';
import { TurboModule, ExpoModule, BridgeModule } from 'benchmarking';
import { useCallback, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type BenchmarkResult = {
  expoTime: number;
  turboTime: number;
  bridgeTime: number;
};

type AsyncBenchmarkResult = {
  expoTime: number;
  expoOptimizedTime: number;
};

const runs = 100_000;
const asyncRuns = 10_000;

function runVoidBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.nothing();

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      ExpoModule.nothing();
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(`ExpoModule took ${expoTime.toFixed(2)}ms to run nothing() ${runs}x!`);
  }

  let turboTime = 0;
  if (TurboModule) {
    TurboModule.nothing();

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      TurboModule.nothing();
    }
    const end = performance.now();
    turboTime = end - start;
    console.log(`TurboModule took ${turboTime.toFixed(2)}ms to run nothing() ${runs}x!`);
  }

  let bridgeTime = 0;
  if (BridgeModule) {
    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      BridgeModule.nothing();
    }
    const end = performance.now();
    bridgeTime = end - start;
    console.log(`BridgeModule took ${bridgeTime.toFixed(2)}ms to run nothing() ${runs}x!`);
  }

  return { expoTime, turboTime, bridgeTime };
}

function runNumberBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.addNumbers(0, 1);

    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      const result = ExpoModule.addNumbers(num, 5);
      if (result !== num + 5) {
        throw new Error('ExpoModule.addNumbers() returned an incorrect result!');
      }
      num = result;
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(`ExpoModule took ${expoTime.toFixed(2)}ms to run addNumbers(...) ${runs}x!`);
  }

  let turboTime = 0;
  if (TurboModule) {
    TurboModule.addNumbers(0, 1);

    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      num = TurboModule.addNumbers(num, 5);
    }
    const end = performance.now();
    turboTime = end - start;
    console.log(`TurboModule took ${turboTime.toFixed(2)}ms to run addNumbers(...) ${runs}x!`);
  }

  let bridgeTime = 0;
  if (BridgeModule) {
    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      num = BridgeModule.addNumbers(num, 5);
    }
    const end = performance.now();
    bridgeTime = end - start;
    console.log(`BridgeModule took ${bridgeTime.toFixed(2)}ms to run addNumbers() ${runs}x!`);
  }

  return { expoTime, turboTime, bridgeTime };
}

function runNumberOptimizedBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.addNumbersOptimized(0, 1);

    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      const result = ExpoModule.addNumbersOptimized(num, 5);
      if (result !== num + 5) {
        throw new Error('ExpoModule.addNumbersOptimized() returned an incorrect result!');
      }
      num = result;
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(
      `ExpoModule took ${expoTime.toFixed(2)}ms to run addNumbersOptimized(...) ${runs}x!`
    );
  }

  let turboTime = 0;
  if (TurboModule) {
    TurboModule.addNumbers(0, 1);

    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      num = TurboModule.addNumbers(num, 5);
    }
    const end = performance.now();
    turboTime = end - start;
    console.log(`TurboModule took ${turboTime.toFixed(2)}ms to run addNumbers(...) ${runs}x!`);
  }

  let bridgeTime = 0;
  if (BridgeModule) {
    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      num = BridgeModule.addNumbers(num, 5);
    }
    const end = performance.now();
    bridgeTime = end - start;
    console.log(`BridgeModule took ${bridgeTime.toFixed(2)}ms to run addNumbers() ${runs}x!`);
  }

  return { expoTime, turboTime, bridgeTime };
}

function runStringsBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.addStrings('hello', 'world');

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      const result = ExpoModule.addStrings('hello ', 'world');
      if (result !== 'hello world') {
        throw new Error('ExpoModule.addStrings() returned an incorrect result!');
      }
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(`ExpoModule took ${expoTime.toFixed(2)}ms to run addNumbers(...) ${runs}x!`);
  }

  let turboTime = 0;
  if (TurboModule) {
    TurboModule.addStrings('hello', 'world');

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      TurboModule.addStrings('hello ', 'world');
    }
    const end = performance.now();
    turboTime = end - start;
    console.log(`TurboModule took ${turboTime.toFixed(2)}ms to run addStrings(...) ${runs}x!`);
  }

  let bridgeTime = 0;
  if (BridgeModule) {
    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      BridgeModule.addStrings('hello', 'world');
    }
    const end = performance.now();
    bridgeTime = end - start;
    console.log(`BridgeModule took ${bridgeTime.toFixed(2)}ms to run addStrings() ${runs}x!`);
  }

  return { expoTime, turboTime, bridgeTime };
}

function runArrayBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.foldArray([1, 2, 3, 4]);

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      ExpoModule.foldArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(`ExpoModule took ${expoTime.toFixed(2)}ms to run foldArray(...) ${runs}x!`);
  }

  let turboTime = 0;
  if (TurboModule) {
    TurboModule.foldArray([1, 2, 3, 4]);

    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      TurboModule.foldArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    const end = performance.now();
    turboTime = end - start;
    console.log(`TurboModule took ${turboTime.toFixed(2)}ms to run foldArray(...) ${runs}x!`);
  }

  let bridgeTime = 0;
  if (BridgeModule) {
    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      BridgeModule.foldArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    const end = performance.now();
    bridgeTime = end - start;
    console.log(`BridgeModule took ${bridgeTime.toFixed(2)}ms to run foldArray() ${runs}x!`);
  }

  return { expoTime, turboTime, bridgeTime };
}

async function runAsyncNumberBenchmark(): Promise<AsyncBenchmarkResult> {
  // Warmup
  await ExpoModule.addNumbersAsync(0, 1);
  await ExpoModule.addNumbersAsyncOptimized(0, 1);

  let expoTime = 0;
  {
    const start = performance.now();
    for (let i = 0; i < asyncRuns; i++) {
      await ExpoModule.addNumbersAsync(i, 5);
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(
      `ExpoModule took ${expoTime.toFixed(2)}ms to run addNumbersAsync(...) ${asyncRuns}x!`
    );
  }

  let expoOptimizedTime = 0;
  {
    const start = performance.now();
    for (let i = 0; i < asyncRuns; i++) {
      await ExpoModule.addNumbersAsyncOptimized(i, 5);
    }
    const end = performance.now();
    expoOptimizedTime = end - start;
    console.log(
      `ExpoModule took ${expoOptimizedTime.toFixed(2)}ms to run addNumbersAsyncOptimized(...) ${asyncRuns}x!`
    );
  }

  return { expoTime, expoOptimizedTime };
}

function BenchmarkResultContainer(props: { functionName: string; result: BenchmarkResult | null }) {
  const { theme } = useTheme();
  const { functionName, result } = props;

  const expoTime = result?.expoTime ? result.expoTime.toFixed(2) + 'ms' : 'null';
  const turboTime = result?.turboTime ? result.turboTime.toFixed(2) + 'ms' : 'null';
  const bridgeTime = result?.bridgeTime ? result.bridgeTime.toFixed(2) + 'ms' : 'null';

  return (
    <View style={styles.benchmarkContainer}>
      <Text style={[styles.testHeader, { color: theme.text.default }]}>
        Calling `{functionName}` {runs.toLocaleString()} times
      </Text>
      <View style={styles.testResult}>
        <Text style={[styles.testResultText, { color: theme.text.default }]}>
          ExpoModule took: <Text style={styles.testResultTime}>{expoTime}</Text>
        </Text>
        <Text style={[styles.testResultText, { color: theme.text.default }]}>
          TurboModule took: <Text style={styles.testResultTime}>{turboTime}</Text>
        </Text>
        <Text style={[styles.testResultText, { color: theme.text.default }]}>
          BridgeModule took: <Text style={styles.testResultTime}>{bridgeTime}</Text>
        </Text>
      </View>
    </View>
  );
}

function AsyncBenchmarkResultContainer(props: {
  functionName: string;
  result: AsyncBenchmarkResult | null;
}) {
  const { theme } = useTheme();
  const { functionName, result } = props;

  const expoTime = result?.expoTime ? result.expoTime.toFixed(2) + 'ms' : 'null';
  const expoOptimizedTime = result?.expoOptimizedTime
    ? result.expoOptimizedTime.toFixed(2) + 'ms'
    : 'null';

  return (
    <View style={styles.benchmarkContainer}>
      <Text style={[styles.testHeader, { color: theme.text.default }]}>
        Calling `{functionName}` {asyncRuns.toLocaleString()} times
      </Text>
      <View style={styles.testResult}>
        <Text style={[styles.testResultText, { color: theme.text.default }]}>
          AsyncFunction took: <Text style={styles.testResultTime}>{expoTime}</Text>
        </Text>
        <Text style={[styles.testResultText, { color: theme.text.default }]}>
          AsyncFunction (optimized) took:{' '}
          <Text style={styles.testResultTime}>{expoOptimizedTime}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function ModulesBenchmarksScreen() {
  const { theme } = useTheme();

  const [voidTimes, setVoidTimes] = useState<BenchmarkResult | null>(null);
  const [numberTimes, setNumberTimes] = useState<BenchmarkResult | null>(null);
  const [numberOptimizedTimes, setNumberOptimizedTimes] = useState<BenchmarkResult | null>(null);
  const [stringTimes, setStringTimes] = useState<BenchmarkResult | null>(null);
  const [arrayTimes, setArrayTimes] = useState<BenchmarkResult | null>(null);
  const [asyncNumberTimes, setAsyncNumberTimes] = useState<AsyncBenchmarkResult | null>(null);

  const startBenchmarks = useCallback(async () => {
    setVoidTimes(runVoidBenchmark());
    setNumberTimes(runNumberBenchmark());
    setNumberOptimizedTimes(runNumberOptimizedBenchmark());
    setStringTimes(runStringsBenchmark());
    setArrayTimes(runArrayBenchmark());
    setAsyncNumberTimes(await runAsyncNumberBenchmark());
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <ScrollView>
        <BenchmarkResultContainer functionName="nothing" result={voidTimes} />
        <BenchmarkResultContainer functionName="addNumbers" result={numberTimes} />
        <BenchmarkResultContainer
          functionName="addNumbersOptimized"
          result={numberOptimizedTimes}
        />
        <BenchmarkResultContainer functionName="addStrings" result={stringTimes} />
        <BenchmarkResultContainer functionName="foldArray" result={arrayTimes} />
        <AsyncBenchmarkResultContainer functionName="addNumbersAsync" result={asyncNumberTimes} />

        <Button title="Start" color={theme.text.link} onPress={startBenchmarks} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
  },
  benchmarkContainer: {
    margin: 10,
    alignItems: 'center',
  },
  testHeader: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  testResult: {
    margin: 10,
  },
  testResultText: {
    fontSize: 16,
  },
  testResultTime: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
});
