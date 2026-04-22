import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { useTheme, type ThemeType } from '../../common/ThemeProvider';

type StatusCountsProps = {
  passedCount: number;
  failedCount: number;
  theme: ThemeType;
};

function StatusCounts({ passedCount, failedCount, theme }: StatusCountsProps) {
  return (
    <View style={styles.countsRow}>
      <Text style={[styles.status, { color: theme.text.success }]}>{passedCount} passed</Text>
      {failedCount > 0 && (
        <Text style={[styles.status, { color: theme.text.danger }]}>{failedCount} failed</Text>
      )}
    </View>
  );
}

type TestStatusHeaderProps = {
  done: boolean;
  failedCount: number;
  passedCount: number;
  results?: string;
  onCancel: () => void;
};

export default function TestStatusHeader({
  done,
  failedCount,
  passedCount,
  results,
  onCancel,
}: TestStatusHeaderProps) {
  const { theme } = useTheme();
  const totalCount = passedCount + failedCount;

  return (
    <View testID="test_suite_results" style={styles.container}>
      {!done && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" />
          {totalCount > 0 ? (
            <StatusCounts passedCount={passedCount} failedCount={failedCount} theme={theme} />
          ) : (
            <Text
              testID="test_suite_loading_results"
              style={[styles.status, { color: theme.text.default }]}>
              Running tests…
            </Text>
          )}
          <View style={styles.spacer} />
          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.status, { color: theme.text.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {done && (
        <View testID="test_suite_text_results" style={styles.countsRow}>
          {failedCount === 0 && (
            <Text style={[styles.status, { color: theme.text.success }]}>Success!</Text>
          )}
          <Text style={[styles.status, { color: theme.text.success }]}>
            {passedCount}/{totalCount} passed
          </Text>
          {failedCount > 0 && (
            <Text style={[styles.status, { color: theme.text.danger }]}>{failedCount} failed</Text>
          )}
        </View>
      )}
      {done && (
        <Text style={styles.finalResults} pointerEvents="none" testID="test_suite_final_results">
          {results}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  status: {
    fontWeight: '600',
    fontSize: 15,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  spacer: {
    flex: 1,
  },
  finalResults: {
    position: 'absolute',
    opacity: 0,
  },
});
