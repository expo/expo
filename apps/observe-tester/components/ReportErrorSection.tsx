import { Observe } from 'expo-observe';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

// Demonstrates the public `Observe.reportError` API: reporting an error your own code caught and
// handled. Unlike the JavaScript errors section (which exercises the automatic global handler and
// error boundary), these are explicit reports a developer makes from a `try`/`catch`, recorded as
// non-fatal `exception` events.

// A realistic caught-and-handled failure: a network call throws, the app recovers, and reports it.
function reportCaughtError() {
  try {
    throw new Error('Failed to sync cart: request timed out');
  } catch (error) {
    Observe.reportError(error);
  }
}

// `Observe.reportError` accepts any thrown value, not just `Error`. A non-`Error` throw is
// stringified into the message and carries no stacktrace.
function reportNonError() {
  try {
    throw 'unexpected string rejection';
  } catch (error) {
    Observe.reportError(error);
  }
}

export function ReportErrorSection() {
  const theme = useTheme();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Report caught errors</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Report an error your code caught and handled with `Observe.reportError`. Each is recorded as
        a non-fatal `exception` event in the current session.
      </Text>
      <Button
        title="Report a caught Error"
        description="try/catch around a real Error, reported with its stacktrace"
        onPress={reportCaughtError}
        theme="secondary"
      />
      <Button
        title="Report a non-Error throw"
        description="A thrown string, stringified into the message with no stacktrace"
        onPress={reportNonError}
        theme="secondary"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
});
