import { useTheme } from 'ThemeProvider';
import { TurboModule, ExpoModule, BridgeModule } from 'benchmarking';
import { useCallback, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type BenchmarkResult = {
  expoTime: number;
  turboTime: number;
  bridgeTime: number;
};

const runs = 100_000;

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
  {
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
  {
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
  {
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

function runNumberOptimizedSlowPathBenchmark(): BenchmarkResult {
  let expoTime = 0;
  {
    ExpoModule.addNumbersOptimizedSlowPath(0, 1, 2);

    const start = performance.now();
    let num = 0;
    for (let i = 0; i < runs; i++) {
      const result = ExpoModule.addNumbersOptimizedSlowPath(num, 5, 5);
      if (result !== num + 5 + 5) {
        throw new Error('ExpoModule.addNumbersOptimizedSlowPath() returned an incorrect result!');
      }
      num = result;
    }
    const end = performance.now();
    expoTime = end - start;
    console.log(
      `ExpoModule took ${expoTime.toFixed(2)}ms to run addNumbersOptimizedSlowPath(...) ${runs}x!`
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
  {
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
  {
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
  {
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

function BenchmarkResultContainer(props: { functionName: string; result: BenchmarkResult | null }) {
  const { theme } = useTheme();
  const { functionName, result } = props;

  const expoTime = result?.expoTime ? result.expoTime.toFixed(2) + 'ms' : 'null';
  const turboTime = result?.turboTime ? result.turboTime.toFixed(2) + 'ms' : 'null';
  const bridgeTime = result?.bridgeTime ? result.bridgeTime.toFixed(2) + 'ms' : 'null';

  return (
    <View style={styles.benchmarkContainer}>
      <Text style={[styles.testHeader, { color: theme.text.default }]}>
        Calling `{functionName}` 100.000 times
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

export default function ModulesBenchmarksScreen() {
  const { theme } = useTheme();

  const [voidTimes, setVoidTimes] = useState<BenchmarkResult | null>(null);
  const [numberTimes, setNumberTimes] = useState<BenchmarkResult | null>(null);
  const [numberOptimizedTimes, setNumberOptimizedTimes] = useState<BenchmarkResult | null>(null);
  const [numberOptimizedSlowPathTimes, setNumberOptimizedSlowPathTimes] =
    useState<BenchmarkResult | null>(null);
  const [stringTimes, setStringTimes] = useState<BenchmarkResult | null>(null);
  const [arrayTimes, setArrayTimes] = useState<BenchmarkResult | null>(null);

  const startBenchmarks = useCallback(() => {
    setVoidTimes(runVoidBenchmark());
    setNumberTimes(runNumberBenchmark());
    setNumberOptimizedTimes(runNumberOptimizedBenchmark());
    setNumberOptimizedSlowPathTimes(runNumberOptimizedSlowPathBenchmark());
    setStringTimes(runStringsBenchmark());
    setArrayTimes(runArrayBenchmark());
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
        <BenchmarkResultContainer
          functionName="addNumbersOptimizedSlowPath"
          result={numberOptimizedSlowPathTimes}
        />
        <BenchmarkResultContainer functionName="addStrings" result={stringTimes} />
        <BenchmarkResultContainer functionName="foldArray" result={arrayTimes} />

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
