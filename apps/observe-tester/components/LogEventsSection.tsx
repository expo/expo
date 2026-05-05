import AppMetrics, { type LogAttributeValue, type LogSeverity } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { severityColors, usePaletteScheme } from '@/utils/severity';
import { useTheme } from '@/utils/theme';

type LogEventTrigger = {
  severity: LogSeverity;
  title: string;
  description: string;
  body?: string;
  attributes?: Record<string, LogAttributeValue>;
};

const LOG_EVENT_TRIGGERS: LogEventTrigger[] = [
  {
    severity: 'trace',
    title: 'Trace',
    description: 'String + boolean attributes',
    body: 'Entered render path',
    attributes: {
      component: 'Debug',
      phase: 'render',
      isFirstPaint: true,
    },
  },
  {
    severity: 'debug',
    title: 'Debug',
    description: 'Integer and double attributes',
    body: 'Cache lookup completed',
    attributes: {
      cache: 'user_profile',
      hit: false,
      lookups: 42,
      hitRate: 0.87,
    },
  },
  {
    severity: 'info',
    title: 'Info',
    description: 'Array of strings + nested object',
    body: 'User opened the debug tab',
    attributes: {
      tab: 'debug',
      breadcrumb: ['home', 'sessions', 'debug'],
      device: { os: 'ios', simulator: true },
    },
  },
  {
    severity: 'warn',
    title: 'Warn',
    description: 'Mixed numeric types and a homogeneous int array',
    body: 'Network request retried after timeout',
    attributes: {
      url: 'https://example.com/api',
      attempt: 2,
      timeoutMs: 1500,
      latencyMs: 1843.27,
      retryDelaysMs: [100, 250, 500],
    },
  },
  {
    severity: 'error',
    title: 'Error',
    description: 'Reserved expo.* and SDK-set keys (will be dropped)',
    body: 'Caller tried to spoof internal attributes',
    attributes: {
      code: 'PREFS_LOAD_FAILED',
      userId: 'demo-user',
      // All four below should be filtered and surface as
      // `droppedAttributesCount: 4` on the wire — `expo.*` for the namespace
      // rule and `event.name` / `session.id` for the SDK-set rule.
      'expo.app.name': 'pretend-internal',
      'expo.eas_client.id': 'spoofed',
      'event.name': 'spoofed.event',
      'session.id': 'spoofed-session',
    },
  },
  {
    severity: 'fatal',
    title: 'Fatal',
    description: 'Deeply nested kvlist',
    body: 'Database connection lost mid-write',
    attributes: {
      table: 'sessions',
      transaction: {
        id: 'tx_8821',
        durationMs: 312.4,
        readOnly: false,
        rowsAffected: 17,
        statements: ['BEGIN', 'UPDATE', 'COMMIT'],
      },
    },
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
