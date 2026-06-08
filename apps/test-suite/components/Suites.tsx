import * as Clipboard from 'expo-clipboard';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Statuses from '../constants/Statuses';
import { type Suite } from '../types';
import StatusIndicator from './StatusIndicator';
import SuiteResult from './SuiteResult';
import TestStatusHeader from './TestStatusHeader';
import { useTheme } from '../../common/ThemeProvider';

const supportsGlass = isLiquidGlassAvailable();

function suiteHasFailures(suite: Suite): boolean {
  if (suite.specs.some((s) => s.status === 'failed')) {
    return true;
  }
  return suite.children.some(suiteHasFailures);
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function countSpecs(suite: Suite): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;
  for (const spec of suite.specs) {
    if (spec.status === 'passed') passed++;
    else if (spec.status === 'failed') failed++;
  }
  for (const child of suite.children) {
    const counts = countSpecs(child);
    passed += counts.passed;
    failed += counts.failed;
  }
  return { passed, failed };
}

function CopyFailuresButton({ failures }: { failures: string }) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyFailures = useCallback(async () => {
    await Clipboard.setStringAsync(failures);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [failures]);

  return (
    <TouchableOpacity onPress={copyFailures}>
      <Text style={[styles.actionText, { color: theme.text.link }]}>
        {copied ? 'Copied!' : 'Copy failure logs'}
      </Text>
    </TouchableOpacity>
  );
}

type SuitesProps = {
  suites: Suite[];
  done: boolean;
  failedCount: number;
  passedCount: number;
  selectionQuery?: string;
  results?: string;
  failures?: string;
  totalDuration?: number;
  onReplay: (options?: { failedOnly?: boolean }) => void;
  onCancel: () => void;
};

export default function Suites({
  suites,
  done,
  failedCount,
  passedCount,
  selectionQuery,
  results,
  failures,
  totalDuration,
  onReplay,
  onCancel,
}: SuitesProps) {
  const { theme } = useTheme();
  const listRef = useRef<FlatList<Suite>>(null);
  const layoutHeight = useRef(0);
  const [failuresOnly, setFailuresOnly] = useState(false);

  const toggleFailuresOnly = useCallback(() => {
    setFailuresOnly((prev) => {
      if (prev) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({ animated: true });
        });
      }
      return !prev;
    });
  }, []);

  const handleReplay = useCallback(
    (options?: { failedOnly?: boolean }) => {
      setFailuresOnly(false);
      onReplay(options);
    },
    [onReplay]
  );

  const filteredSuites = useMemo(() => {
    if (!failuresOnly) {
      return suites;
    }
    return suites.filter(suiteHasFailures);
  }, [suites, failuresOnly]);

  const header = useMemo(() => {
    const content = (
      <TestStatusHeader
        done={done}
        failedCount={failedCount}
        passedCount={passedCount}
        selectionQuery={selectionQuery}
        results={results}
        onCancel={onCancel}
      />
    );

    if (supportsGlass) {
      return <GlassView>{content}</GlassView>;
    }
    return (
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.background.default,
            borderBottomColor: theme.border.secondary,
          },
        ]}>
        {content}
      </View>
    );
  }, [done, failedCount, passedCount, selectionQuery, results, onCancel, theme]);

  const footer = useMemo(() => {
    if (!done) {
      return null;
    }
    const totalCount = passedCount + failedCount;

    // Maestro E2E asserts visibility of test_suite_summary_result_text after the FlatList
    // auto-scrolls to the bottom, so that text lives in the bottom footer block below.
    return (
      <View
        testID="test_suite_text_results"
        style={[styles.summary, { borderTopColor: theme.border.secondary }]}>
        <Text
          style={[
            styles.summaryTitle,
            { color: failedCount > 0 ? theme.text.danger : theme.text.success },
          ]}>
          {failedCount > 0 ? 'Some tests failed!' : 'All tests passed!'}
        </Text>
        <Text style={[styles.summaryLine, { color: theme.text.secondary }]}>
          {suites.length} suite{suites.length !== 1 ? 's' : ''}, {totalCount} test
          {totalCount !== 1 ? 's' : ''} —{' '}
          <Text style={{ color: theme.text.success }}>{passedCount} passed</Text>
          {failedCount > 0 && ', '}
          {failedCount > 0 && (
            <Text style={{ color: theme.text.danger }}>{failedCount} failed</Text>
          )}
        </Text>
        {totalDuration != null && (
          <Text style={[styles.summaryLine, { color: theme.text.secondary }]}>
            Completed in {formatDuration(totalDuration)}
          </Text>
        )}
        <View style={styles.suitesList}>
          {suites.map((s) => {
            const hasFails = suiteHasFailures(s);
            const counts = countSpecs(s);
            return (
              <View key={s.result.id} style={styles.suiteItem}>
                <View style={styles.suitesListRow}>
                  <StatusIndicator status={hasFails ? Statuses.Failed : Statuses.Passed} />
                  <Text
                    style={[
                      styles.suiteName,
                      { color: hasFails ? theme.text.danger : theme.text.default },
                    ]}>
                    {s.result.description}
                  </Text>
                </View>
                <Text style={[styles.suiteCounts, { color: theme.text.secondary }]}>
                  {counts.passed}/{counts.passed + counts.failed} passed
                  {s.duration != null ? ` — completed in ${formatDuration(s.duration)}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.actions}>
          {failedCount > 0 && (
            <TouchableOpacity onPress={toggleFailuresOnly}>
              <Text style={[styles.actionText, { color: theme.text.link }]}>
                {failuresOnly ? 'Show all suites' : 'Show only failed suites'}
              </Text>
            </TouchableOpacity>
          )}
          {failedCount > 0 && (
            <TouchableOpacity onPress={() => handleReplay({ failedOnly: true })}>
              <Text style={[styles.actionText, { color: theme.text.link }]}>
                Replay failed suites
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleReplay()}>
            <Text style={[styles.actionText, { color: theme.text.link }]}>Replay all</Text>
          </TouchableOpacity>
          {failedCount > 0 && failures != null && <CopyFailuresButton failures={failures} />}
        </View>
        <View style={[styles.resultFooter, { borderTopColor: theme.border.secondary }]}>
          <Text style={[styles.resultFooterLabel, { color: theme.text.secondary }]}>Result</Text>
          <Text
            testID="test_suite_summary_result_text"
            style={[
              styles.summaryTitle,
              styles.resultFooterTitle,
              { color: failedCount > 0 ? theme.text.danger : theme.text.success },
            ]}>
            {failedCount > 0 ? 'Some tests failed!' : 'All tests passed!'}
          </Text>
        </View>
      </View>
    );
  }, [
    done,
    suites,
    passedCount,
    failedCount,
    failures,
    failuresOnly,
    totalDuration,
    handleReplay,
    toggleFailuresOnly,
    theme,
  ]);

  const wasDoneRef = useRef(false);

  const onContentSizeChange = useCallback(
    (_w: number, contentHeight: number) => {
      if (!listRef.current || layoutHeight.current <= 0) {
        return;
      }
      const offset = contentHeight - layoutHeight.current;
      if (!done) {
        if (offset > 0) {
          listRef.current.scrollToOffset({ offset, animated: false });
        }
        wasDoneRef.current = false;
      } else if (!wasDoneRef.current) {
        wasDoneRef.current = true;
        if (offset > 0) {
          listRef.current.scrollToOffset({ offset, animated: true });
        }
      }
    },
    [done]
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeight.current = e.nativeEvent.layout.height;
  }, []);

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        style={[styles.list, { backgroundColor: theme.background.screen }]}
        contentContainerStyle={styles.listContent}
        data={filteredSuites}
        keyExtractor={(item) => item.result.id}
        renderItem={({ item }) => (
          <SuiteResult suite={item} depth={0} failuresOnly={failuresOnly} />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        stickyHeaderIndices={[0]}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    marginTop: -StyleSheet.hairlineWidth,
    padding: 20,
    borderTopWidth: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  suitesList: {
    marginVertical: 12,
  },
  suiteItem: {
    marginBottom: 6,
  },
  suitesListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suiteName: {
    fontSize: 14,
    flex: 1,
  },
  suiteCounts: {
    fontSize: 13,
    marginLeft: 28,
  },
  actions: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  resultFooterLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultFooterTitle: {
    marginBottom: 0,
  },
});
