import AppMetrics, { type LogSeverity } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { severityColors, usePaletteScheme } from '@/utils/severity';
import { useTheme } from '@/utils/theme';

type LogEventTrigger = {
  severity: LogSeverity;
  title: string;
  description: string;
  body?: string;
  attributes?: Record<string, unknown>;
};

const LOG_EVENT_TRIGGERS: LogEventTrigger[] = [
  {
    severity: 'trace',
    title: 'Trace',
    description: 'Lowest severity, fine-grained tracing',
    body: 'Entered render path',
    attributes: { component: 'Debug', phase: 'render' },
  },
  {
    severity: 'debug',
    title: 'Debug',
    description: 'Diagnostic detail useful while developing',
    body: 'Cache miss for key user_profile',
    attributes: { cache: 'user_profile', miss: true },
  },
  {
    severity: 'info',
    title: 'Info',
    description: 'Routine informational event',
    body: 'User opened the debug tab',
    attributes: { tab: 'debug' },
  },
  {
    severity: 'warn',
    title: 'Warn',
    description: 'Unexpected but recoverable condition',
    body: 'Network request retried after timeout',
    attributes: { url: 'https://example.com/api', attempt: 2 },
  },
  {
    severity: 'error',
    title: 'Error',
    description: 'Operation failed but the app is still running',
    body: 'Failed to load user preferences',
    attributes: { code: 'PREFS_LOAD_FAILED', userId: 'demo-user' },
  },
  {
    severity: 'fatal',
    title: 'Fatal',
    description: 'Severe failure, often followed by termination',
    body: 'Database connection lost mid-write',
    attributes: { table: 'sessions' },
  },
];

export function LogEventsSection() {
  const theme = useTheme();
  const paletteScheme = usePaletteScheme();

  if (typeof AppMetrics.logEvent !== 'function') {
    return null;
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Log events</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Record a log event of the chosen severity against the current session. Each tap dispatches
        on the next flush to the OpenTelemetry logs endpoint.
      </Text>
      {LOG_EVENT_TRIGGERS.map(({ severity, title, description, body, attributes }) => {
        const colors = severityColors(severity, theme, paletteScheme);
        return (
          <Button
            key={severity}
            title={title}
            description={description}
            onPress={() =>
              AppMetrics.logEvent(`debug.${severity}_button_pressed`, {
                severity,
                body,
                attributes,
              })
            }
            theme="secondary"
            colors={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              textColor: colors.text,
            }}
          />
        );
      })}
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
