import type { LogRecord } from 'expo-app-metrics';
import { StyleSheet, Text, View } from 'react-native';

import { JSONView } from '@/components/JSONView';
import { severityColors, usePaletteScheme } from '@/utils/severity';
import { useTheme } from '@/utils/theme';

export function LogsPanel({ logs }: { logs: LogRecord[] }) {
  const theme = useTheme();
  const paletteScheme = usePaletteScheme();
  if (logs.length === 0) {
    return (
      <Text style={[styles.empty, { color: theme.text.secondary }]}>No log events recorded</Text>
    );
  }

  const sorted = [...logs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <View style={styles.container}>
      {sorted.map((log, index) => {
        const colors = severityColors(log.severity, theme, paletteScheme);
        const hasAttributes = log.attributes != null && Object.keys(log.attributes).length > 0;
        return (
          <View
            key={`${log.timestamp}-${log.name}-${index}`}
            style={[
              styles.item,
              {
                backgroundColor: theme.background.element,
                borderColor: theme.border.default,
                borderLeftColor: colors.border,
              },
            ]}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.name, { color: theme.text.default }]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {log.name}
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {log.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.timestamp, { color: theme.text.tertiary }]}>
              {formatTime(log.timestamp)}
            </Text>
            {log.body ? (
              <Text style={[styles.body, { color: theme.text.secondary }]}>{log.body}</Text>
            ) : null}
            {hasAttributes ? (
              <View style={styles.attributes}>
                <Text style={[styles.metaLabel, { color: theme.text.default }]}>Attributes</Text>
                <JSONView
                  value={log.attributes}
                  bordered={false}
                  textColor={theme.text.secondary}
                  showCopyButton={false}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
});

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return timeFormatter.format(date);
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  item: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontFamily: 'Menlo',
    fontSize: 11,
    marginTop: 2,
  },
  body: {
    fontSize: 13,
    marginTop: 6,
  },
  attributes: {
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
});
