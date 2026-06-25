import { useNetworkRequestObserver, type NetworkRequestRedirect } from 'expo-app-metrics';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

const RECENT_LIMIT = 30;

type StartedRow = {
  kind: 'started';
  id: string;
  url: string;
  method: string;
  startedAt: number;
};

type CompletedRow = {
  kind: 'completed';
  id: string;
  url: string;
  method: string;
  statusCode: number | null;
  totalDuration: number;
  requestBytesSent: number | null;
  responseBytesReceived: number | null;
  errorDescription: string | null;
  redirects: NetworkRequestRedirect[];
  networkProtocol: string | null;
};

type Row = StartedRow | CompletedRow;

export function NetworkRequestObserverSection() {
  const theme = useTheme();
  const [rows, setRows] = useState<Row[]>([]);
  // Tracks which started ids have already been collapsed into a completed row,
  // so we don't render duplicates when both events arrive.
  const completedIds = useRef<Set<string>>(new Set());

  useNetworkRequestObserver({
    onStarted(event) {
      setRows((prev) => {
        const next: StartedRow = {
          kind: 'started',
          id: event.id,
          url: event.url,
          method: event.method,
          startedAt: Date.parse(event.startedAt),
        };
        return [next, ...prev].slice(0, RECENT_LIMIT);
      });
    },
    onCompleted(event) {
      completedIds.current.add(event.id);
      setRows((prev) => {
        const completed: CompletedRow = {
          kind: 'completed',
          id: event.id,
          url: event.url,
          method: event.method,
          statusCode: event.statusCode,
          totalDuration: event.totalDuration,
          requestBytesSent: event.requestBytesSent,
          responseBytesReceived: event.responseBytesReceived,
          errorDescription: event.errorDescription,
          redirects: event.redirects,
          networkProtocol: event.networkProtocol,
        };
        // Replace the matching started row if it's still on screen, else prepend.
        const existing = prev.findIndex((r) => r.id === event.id);
        if (existing >= 0) {
          const out = prev.slice();
          out[existing] = completed;
          return out;
        }
        return [completed, ...prev].slice(0, RECENT_LIMIT);
      });
    },
  });

  function fireSample() {
    fetch('https://expo.dev').catch(() => {});
  }

  function fireRandomImage() {
    // `picsum.photos/seed/<seed>/<width>/<height>` returns a random image deterministically
    // keyed by the seed, with payloads ranging from tens of KB to a few MB depending on size.
    const seed = Math.floor(Math.random() * 1_000_000);
    const size = 200 + Math.floor(Math.random() * 800);
    fetch(`https://picsum.photos/seed/${seed}/${size}/${size}`).catch(() => {});
  }

  function fireFailing() {
    fetch('https://expo.dev/this-route-does-not-exist-' + Date.now()).catch(() => {});
  }

  function firePost() {
    fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'from observe-tester', at: new Date().toISOString() }),
    }).catch(() => {});
  }

  function fireSlow() {
    fetch('https://httpbin.org/delay/3').catch(() => {});
  }

  function fireMultiRedirect() {
    fetch('https://httpbin.org/redirect/3').catch(() => {});
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Network requests</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Subscribes a `NetworkRequestObserver` and streams every HTTP request through the panel. Each
        row shows the started state first, then collapses into the completed snapshot when the
        request finishes.
      </Text>
      <View style={styles.buttonRow}>
        <CompactButton title="GET expo.dev" onPress={fireSample} />
        <CompactButton title="Random image" onPress={fireRandomImage} />
        <CompactButton title="POST JSON" onPress={firePost} />
        <CompactButton title="Slow (3s)" onPress={fireSlow} />
        <CompactButton title="Multi-redirect" onPress={fireMultiRedirect} />
        <CompactButton title="Failing request" onPress={fireFailing} />
        <CompactButton title="Clear" onPress={() => setRows([])} />
      </View>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.text.secondary }]}>
          No requests observed yet. Press a button above, or trigger any other fetch in the app.
        </Text>
      ) : (
        rows.map((row) => <RequestRow key={row.id} row={row} />)
      )}
    </>
  );
}

function RequestRow({ row }: { row: Row }) {
  const theme = useTheme();
  const isCompleted = row.kind === 'completed';
  const status = isCompleted ? row.statusCode : null;
  const isError =
    isCompleted &&
    (row.errorDescription != null || (status != null && (status < 200 || status >= 300)));
  const leftBorderColor = isError
    ? theme.icon.danger
    : isCompleted
      ? theme.icon.success
      : theme.border.default;
  const statusColor = statusCodeColor(
    theme,
    isCompleted,
    status,
    row.kind === 'completed' ? row.errorDescription : null
  );

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.background.element,
          borderColor: theme.border.default,
          borderLeftWidth: 3,
          borderLeftColor: leftBorderColor,
        },
      ]}>
      <View style={styles.rowHeader}>
        <Text style={[styles.method, { color: theme.text.default }]}>{row.method}</Text>
        <View style={styles.rowHeaderRight}>
          {isCompleted && row.networkProtocol ? (
            <Text
              style={[
                styles.badge,
                { color: theme.text.secondary, borderColor: theme.border.default },
              ]}>
              {row.networkProtocol}
            </Text>
          ) : null}
          <Text style={[styles.status, { color: statusColor }]}>
            {isCompleted
              ? status != null
                ? String(status)
                : (row.errorDescription ?? 'error')
              : '…'}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.url, { color: theme.text.default }]}>
        {row.url}
      </Text>
      {isCompleted && row.redirects.length > 0 ? (
        <View style={styles.redirectList}>
          {row.redirects.map((r, index) => (
            <Text
              key={`${r.toUrl}-${index}`}
              numberOfLines={1}
              style={[styles.redirects, { color: theme.text.secondary }]}>
              via {r.statusCode} {r.toUrl}
            </Text>
          ))}
        </View>
      ) : null}
      {isCompleted ? (
        <Text style={[styles.meta, { color: theme.text.secondary }]}>
          {(row.totalDuration * 1000).toFixed(0)} ms · ↑ {formatBytes(row.requestBytesSent)} · ↓{' '}
          {formatBytes(row.responseBytesReceived)}
        </Text>
      ) : null}
    </View>
  );
}

function statusCodeColor(
  theme: ReturnType<typeof useTheme>,
  isCompleted: boolean,
  status: number | null,
  errorDescription: string | null
): string {
  if (!isCompleted) {
    return theme.text.secondary;
  }
  if (errorDescription != null) {
    return theme.text.danger;
  }
  if (status == null) {
    return theme.text.secondary;
  }
  if (status >= 200 && status < 300) {
    return theme.text.success;
  }
  if (status >= 300 && status < 400) {
    return theme.text.warning;
  }
  return theme.text.danger;
}

function CompactButton({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useTheme();
  const tokens = theme.button.secondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactButton,
        { backgroundColor: tokens.background, borderColor: tokens.border },
        pressed ? styles.compactButtonPressed : null,
      ]}>
      <Text style={[styles.compactButtonText, { color: tokens.text }]}>{title}</Text>
    </Pressable>
  );
}

function formatBytes(value: number | null): string {
  if (value == null) {
    return '–';
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  compactButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
  compactButtonPressed: {
    opacity: 0.5,
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  row: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowHeaderRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -2,
  },
  badge: {
    fontSize: 10,
    fontFamily: 'Menlo',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  method: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  status: {
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  url: {
    fontSize: 12,
    fontFamily: 'Menlo',
    marginTop: 6,
  },
  redirectList: {
    marginTop: 2,
  },
  redirects: {
    fontSize: 11,
    fontFamily: 'Menlo',
  },
  meta: {
    fontSize: 11,
    marginTop: 4,
  },
});
