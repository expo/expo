import type { CrashReport } from 'expo-app-metrics';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

export function CrashReportPanel({ report }: { report: CrashReport }) {
  const theme = useTheme();
  const exceptionLabel = formatExceptionLabel(report.exceptionType, report.signal);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background.danger,
          borderColor: theme.border.danger,
        },
      ]}>
      {exceptionLabel ? (
        <Text style={[styles.headline, { color: theme.text.danger }]}>{exceptionLabel}</Text>
      ) : null}
      {report.terminationReason ? (
        <Field label="Termination reason" value={report.terminationReason} mono />
      ) : null}
      {report.virtualMemoryRegionInfo ? (
        <Field label="VM region" value={report.virtualMemoryRegionInfo} mono />
      ) : null}
      {report.exceptionReason ? (
        <View style={styles.exceptionReason}>
          <Text style={[styles.exceptionMessage, { color: theme.text.default }]}>
            {report.exceptionReason.composedMessage}
          </Text>
          <Text style={[styles.exceptionMeta, { color: theme.text.secondary }]}>
            {report.exceptionReason.className} · {report.exceptionReason.exceptionType}
          </Text>
        </View>
      ) : null}
      <View style={styles.timing}>
        <Text style={[styles.timingText, { color: theme.text.secondary }]}>
          Window: {formatDate(report.timestampBegin)} → {formatDate(report.timestampEnd)}
        </Text>
        <Text style={[styles.timingText, { color: theme.text.secondary }]}>
          Ingested: {formatDate(report.ingestedAt)}
        </Text>
      </View>
    </View>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text.tertiary }]}>{label}</Text>
      <Text
        style={[styles.fieldValue, mono && styles.fieldValueMono, { color: theme.text.default }]}>
        {value}
      </Text>
    </View>
  );
}

function formatExceptionLabel(type: number | null | undefined, signal: number | null | undefined) {
  const parts: string[] = [];
  if (type != null) parts.push(exceptionName(type));
  if (signal != null) parts.push(signalName(signal));
  return parts.join(' · ');
}

function exceptionName(type: number) {
  switch (type) {
    case 1:
      return 'EXC_BAD_ACCESS';
    case 2:
      return 'EXC_BAD_INSTRUCTION';
    case 3:
      return 'EXC_ARITHMETIC';
    case 4:
      return 'EXC_EMULATION';
    case 5:
      return 'EXC_SOFTWARE';
    case 6:
      return 'EXC_BREAKPOINT';
    case 10:
      return 'EXC_CRASH';
    case 11:
      return 'EXC_RESOURCE';
    case 12:
      return 'EXC_GUARD';
    default:
      return `EXC_${type}`;
  }
}

function signalName(signal: number) {
  switch (signal) {
    case 4:
      return 'SIGILL';
    case 5:
      return 'SIGTRAP';
    case 6:
      return 'SIGABRT';
    case 8:
      return 'SIGFPE';
    case 9:
      return 'SIGKILL';
    case 10:
      return 'SIGBUS';
    case 11:
      return 'SIGSEGV';
    default:
      return `SIG${signal}`;
  }
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldValueMono: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  exceptionReason: {
    gap: 4,
  },
  exceptionMessage: {
    fontSize: 14,
    fontWeight: '600',
  },
  exceptionMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  timing: {
    gap: 2,
  },
  timingText: {
    fontSize: 11,
  },
});
