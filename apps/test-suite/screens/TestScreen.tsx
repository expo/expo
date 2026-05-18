import jasmineRequire from 'jasmine-core/lib/jasmine-core/jasmine';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import ExponentTest from '../ExponentTest';
import { getTestModules, Module } from '../TestModules';
import { getScreenIdForLinking, getSelectedTestNames } from './getScreenIdForLinking';
import Portal from '../components/Portal';
import RunnerError from '../components/RunnerError';
import Suites from '../components/Suites';
import { JasmineResult, Suite } from '../types';

const FLUSH_INTERVAL = 500;

type TestScreenState = {
  suites: Suite[];
  selectedModules: Module[];
  testPortal: ReactNode;
  failedCount: number;
  passedCount: number;
  done: boolean;
  testRunnerError: string | null;
  results?: string;
  failures?: string;
  totalDuration?: number;
};

function suiteHasFailures(suite: Suite): boolean {
  if (suite.specs.some((s) => s.status === 'failed')) {
    return true;
  }
  return suite.children.some(suiteHasFailures);
}

function useTestRunner() {
  const [state, setState] = useState<TestScreenState>({
    suites: [],
    selectedModules: [],
    testPortal: null,
    failedCount: 0,
    passedCount: 0,
    done: false,
    testRunnerError: null,
  });

  const mountedRef = useRef(true);
  const suitesRef = useRef<Suite[]>([]);
  const suitePathRef = useRef<number[]>([]);
  const passedCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const cancelledRef = useRef(false);
  const resultsRef = useRef('');
  const failuresRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suiteModuleMapRef = useRef(new Map<number, string>());
  const currentModuleRef = useRef<string | null>(null);
  const portalActiveRef = useRef(false);
  const runStartTimeRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (flushTimerRef.current != null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  const runTests = useCallback((selectedModules: Module[]) => {
    if (flushTimerRef.current != null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    suitesRef.current = [];
    suitePathRef.current = [];
    passedCountRef.current = 0;
    failedCountRef.current = 0;
    cancelledRef.current = false;
    resultsRef.current = '';
    failuresRef.current = '';
    suiteModuleMapRef.current = new Map();

    setState({
      suites: [],
      selectedModules,
      testPortal: null,
      failedCount: 0,
      passedCount: 0,
      done: false,
      testRunnerError: null,
    });

    function scheduleFlush() {
      if (flushTimerRef.current != null) {
        return;
      }
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            suites: [...suitesRef.current],
            passedCount: passedCountRef.current,
            failedCount: failedCountRef.current,
          }));
        }
      }, FLUSH_INTERVAL);
    }

    function flushNow() {
      if (flushTimerRef.current != null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          suites: [...suitesRef.current],
          passedCount: passedCountRef.current,
          failedCount: failedCountRef.current,
        }));
      }
    }

    function currentSuite(): Suite | { children: Suite[] } {
      let node: Suite | { children: Suite[] } = { children: suitesRef.current };
      for (const index of suitePathRef.current) {
        node = (node as Suite).children[index];
      }
      return node;
    }

    function setPortalChild(testPortal: ReactNode) {
      portalActiveRef.current = true;
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, testPortal }));
      }
    }

    function cleanupPortal() {
      portalActiveRef.current = false;
      return new Promise<void>((resolve) => {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, testPortal: null }));
          requestAnimationFrame(() => resolve());
        }
      });
    }

    const jasmineCore = jasmineRequire.core(jasmineRequire);
    class NoopGlobalErrors {
      install() {}
      uninstall() {}
      pushListener() {}
      popListener() {}
      setOverrideListener() {}
      removeOverrideListener() {}
      reportUnhandledRejections() {}
    }
    const jasmineEnv = jasmineCore.getEnv({
      suppressLoadErrors: true,
      GlobalErrors: NoopGlobalErrors,
    });
    jasmineEnv.configure({ random: false });

    const suiteStartTimes = new Map<string, number>();

    jasmineEnv.addReporter({
      suiteStarted(jasmineResult: JasmineResult) {
        if (cancelledRef.current) return;
        suiteStartTimes.set(jasmineResult.id, performance.now());
        const parent = currentSuite() as Suite;
        const suite: Suite = { result: jasmineResult, children: [], specs: [] };
        parent.children.push(suite);
        suitePathRef.current.push(parent.children.length - 1);
        scheduleFlush();
      },

      suiteDone(jasmineResult: JasmineResult) {
        if (cancelledRef.current) return;
        const startTime = suiteStartTimes.get(jasmineResult.id);
        if (startTime != null) {
          const suite = currentSuite() as Suite;
          suite.duration = performance.now() - startTime;
        }
        suitePathRef.current.pop();
        flushNow();
      },

      specStarted(jasmineResult: JasmineResult) {
        if (cancelledRef.current) return;
        const suite = currentSuite() as Suite;
        suite.specs.push({ ...jasmineResult });
        scheduleFlush();
      },

      specDone(jasmineResult: JasmineResult) {
        if (cancelledRef.current) return;
        if (portalActiveRef.current) {
          console.warn(
            `The test portal has not been cleaned up by \`${jasmineResult.fullName}\`. Call \`cleanupPortal\` before finishing the test.`
          );
        }
        const suite = currentSuite() as Suite;
        suite.specs[suite.specs.length - 1] = { ...jasmineResult };
        scheduleFlush();
      },
    });

    jasmineEnv.addReporter({
      specDone(result: JasmineResult) {
        if (cancelledRef.current) {
          return;
        }
        if (result.status === 'passed' || result.status === 'failed') {
          const grouping = result.status === 'passed' ? '---' : '+++';
          resultsRef.current += `${grouping} ${result.fullName}\n`;

          if (result.status === 'passed') {
            passedCountRef.current++;
          }

          if (result.status === 'failed') {
            failedCountRef.current++;
            const lines = [`[FAIL] ${result.fullName}`];
            result.failedExpectations.forEach(({ message }) => {
              lines.push(`       ${message}`);
            });
            const output = lines.join('\n');
            console.warn(output);
            if (ExponentTest && ExponentTest.log) {
              ExponentTest.log(output);
            }
            failuresRef.current += `${grouping} ${result.fullName}\n`;
            result.failedExpectations.forEach(({ message }) => {
              resultsRef.current += `${message}\n`;
              failuresRef.current += `${message}\n`;
            });
          }
        }
      },

      jasmineStarted() {
        runStartTimeRef.current = performance.now();
      },

      jasmineDone() {
        if (cancelledRef.current) {
          return;
        }
        const totalDuration = performance.now() - runStartTimeRef.current;
        const result = {
          magic: '[TEST-SUITE-END]',
          failed: failedCountRef.current,
          failures: failuresRef.current,
          results: resultsRef.current,
        };

        const jsonResult = JSON.stringify(result);
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            done: true,
            failedCount: failedCountRef.current,
            passedCount: passedCountRef.current,
            results: jsonResult,
            failures: failuresRef.current,
            totalDuration,
          }));
        }

        console.log(jsonResult);

        if (ExponentTest) {
          ExponentTest.completed(
            JSON.stringify({
              failed: failedCountRef.current,
              failures: failuresRef.current,
              results: resultsRef.current,
            })
          );
        }
      },
    });

    const jasmine = jasmineRequire.interface(jasmineCore, jasmineEnv);
    jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    // Wrap it/xit/fit so that test functions taking unused parameters
    // (e.g. `async (t) => {}`) aren't mistaken by jasmine 5.x as
    // callback-style tests expecting a `done` argument.
    const wrapSpec = (fn: Function) => () => fn();
    const origIt = jasmine.it;
    jasmine.it = (desc: string, fn: Function, t?: number) => origIt(desc, wrapSpec(fn), t);
    const origXit = jasmine.xit;
    jasmine.xit = (desc: string, fn: Function, t?: number) => origXit(desc, wrapSpec(fn), t);
    const origFit = jasmine.fit;
    jasmine.fit = (desc: string, fn: Function, t?: number) => origFit(desc, wrapSpec(fn), t);

    const suiteModuleMap = suiteModuleMapRef.current;
    let topLevelSuiteIndex = 0;
    let describeDepth = 0;
    const oldDescribe = jasmine.describe;
    jasmine.describe = (desc: string, fn: () => void) => {
      if (describeDepth === 0) {
        suiteModuleMap.set(topLevelSuiteIndex, currentModuleRef.current!);
        topLevelSuiteIndex++;
      }
      describeDepth++;
      const result = oldDescribe(desc, fn);
      describeDepth--;
      return result;
    };

    (async () => {
      for (const m of selectedModules) {
        currentModuleRef.current = m.name;
        await m.test(jasmine, {
          setPortalChild,
          cleanupPortal,
        });
      }
      currentModuleRef.current = null;
      jasmineEnv.execute().catch((error: unknown) => {
        console.error('[TEST_SUITE] Execution error:', error);
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            done: true,
            testRunnerError: String(error),
          }));
        }
      });
    })();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (flushTimerRef.current != null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (mountedRef.current) {
      setState((prev) => ({
        ...prev,
        done: true,
        suites: [...suitesRef.current],
        passedCount: passedCountRef.current,
        failedCount: failedCountRef.current,
      }));
    }
  }, []);

  const replay = useCallback(
    ({ failedOnly }: { failedOnly?: boolean } = {}) => {
      const { selectedModules } = stateRef.current;
      if (!selectedModules.length) {
        return;
      }
      if (failedOnly) {
        const failedModuleNames = new Set<string>();
        suitesRef.current.forEach((suite, index) => {
          if (suiteHasFailures(suite)) {
            const moduleName = suiteModuleMapRef.current.get(index);
            if (moduleName) {
              failedModuleNames.add(moduleName);
            }
          }
        });
        const failedModules = selectedModules.filter((m) => failedModuleNames.has(m.name));
        runTests(failedModules.length ? failedModules : selectedModules);
      } else {
        runTests(selectedModules);
      }
    },
    [runTests]
  );

  return { state, runTests, cancel, replay };
}

export default function TestScreen({ route }: { route: { params?: { tests?: string } } }) {
  const { state, runTests, cancel, replay } = useTestRunner();
  const prevSelectionQueryRef = useRef('');

  const selectionQuery = route.params?.tests ?? '';

  useEffect(() => {
    if (!selectionQuery) {
      return;
    }
    if (selectionQuery === prevSelectionQueryRef.current) {
      return;
    }
    prevSelectionQueryRef.current = selectionQuery;

    const selectedTestNames = getSelectedTestNames(selectionQuery);
    const selectedModules = getTestModules().filter((m) =>
      selectedTestNames.includes(getScreenIdForLinking(m))
    );

    if (!selectedModules.length) {
      console.warn('[TEST_SUITE]', 'No selected modules', selectedTestNames);
    }
    if (selectedTestNames.length !== selectedModules.length) {
      const selectedModuleNames = selectedModules.map((m) => getScreenIdForLinking(m));
      const missing = selectedTestNames.filter((n) => !selectedModuleNames.includes(n));
      throw new Error(`[TEST_SUITE]: Some selected modules were not found: ${missing}`);
    }

    runTests(selectedModules);
  }, [selectionQuery, runTests]);

  const {
    testRunnerError,
    results,
    done,
    failedCount,
    passedCount,
    suites,
    testPortal,
    selectedModules,
    failures,
    totalDuration,
  } = state;

  if (!selectedModules?.length && !selectionQuery) {
    const moduleLinks = getTestModules().map(getScreenIdForLinking);

    return (
      <ScrollView>
        <RunnerError>
          No tests were found for link: "{route?.params?.tests}"{'\n'}
          Available links: {JSON.stringify(moduleLinks, null, 2)}
        </RunnerError>
      </ScrollView>
    );
  }
  if (testRunnerError) {
    return <RunnerError>{testRunnerError}</RunnerError>;
  }
  return (
    <View testID="test_suite_container" style={styles.container}>
      <Suites
        failedCount={failedCount}
        passedCount={passedCount}
        selectionQuery={
          selectedModules.length > 0
            ? selectedModules.map((m) => m.name).join(', ')
            : selectionQuery
        }
        results={results}
        failures={failures}
        done={done}
        suites={suites}
        totalDuration={totalDuration}
        onReplay={replay}
        onCancel={cancel}
      />
      <Portal isVisible={false}>{testPortal}</Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
