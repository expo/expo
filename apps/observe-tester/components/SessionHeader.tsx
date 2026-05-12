import type { Session } from 'expo-app-metrics';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

export function SessionHeader({ session }: { session: Session }) {
  const theme = useTheme();
  const startDate = new Date(session.startDate);
  const endDate = session.endDate ? new Date(session.endDate) : null;
  const duration = endDate
    ? formatDuration(endDate.getTime() - startDate.getTime())
    : 'still running';
  const crashed = session.type === 'main' && !!session.crashReport;
  const routeName = session.metrics.find((m) => m.name === 'timeToInteractive')?.routeName;

  return (
    <View style={styles.container}>
      <View style={styles.badges}>
        <Badge
          label={capitalize(session.type)}
          background={theme.background.info}
          color={theme.text.info}
        />
        {crashed ? (
          <Badge label="Crashed" background={theme.background.danger} color={theme.text.danger} />
        ) : !session.endDate ? (
          <Badge label="Active" background={theme.background.success} color={theme.text.success} />
        ) : null}
      </View>

      <Field label="Started" value={formatDateTime(startDate)} />
      <Field label="Ended" value={endDate ? formatDateTime(endDate) : '—'} />
      <Field label="Duration" value={duration} />
      <Field label="Metrics" value={String(session.metrics.length)} />
      {routeName ? <Field label="Initial route" value={routeName} monospace /> : null}
      <Field
        label="Session ID"
        value={session.id}
        monospace
        onPress={() => Clipboard.setStringAsync(session.id)}
      />
    </View>
  );
}

function Field({
  label,
  value,
  monospace,
  onPress,
}: {
  label: string;
  value: string;
  monospace?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const valueStyle = [
    styles.fieldValue,
    monospace && styles.fieldValueMono,
    { color: theme.text.default },
  ];
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text.tertiary }]}>{label}</Text>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.fieldValueWrap, pressed && styles.fieldValuePressed]}>
          <Text style={valueStyle} numberOfLines={1}>
            {value}
          </Text>
        </Pressable>
      ) : (
        <Text style={valueStyle}>{value}</Text>
      )}
    </View>
  );
}

function Badge({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) {
    if (remSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    if (remMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (remHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remHours}h`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 84,
  },
  fieldValueWrap: {
    flex: 1,
  },
  fieldValuePressed: {
    opacity: 0.5,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldValueMono: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
});
