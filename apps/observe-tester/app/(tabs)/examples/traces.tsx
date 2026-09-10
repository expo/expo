import AppMetrics from 'expo-app-metrics';
import { Observe } from 'expo-observe';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

type LedgerEntry = {
  name: string;
  detail: string;
  status: 'ok' | 'error' | 'unset';
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

export default function Traces() {
  const theme = useTheme();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [networkStatus, setNetworkStatus] = useState<string | null>(null);
  const [captureEnabled, setCaptureEnabled] = useState(true);

  function pushEntry(entry: LedgerEntry) {
    setLedger((entries) => [entry, ...entries].slice(0, 20));
  }

  // A parent span wrapping an async flow, with an event checkpoint and a nested child span
  // continuing the same trace. `withSpan` ends the parent when the callback settles.
  async function runCheckoutFlow() {
    const startedAt = performance.now();
    await Observe.withSpan(
      'checkout',
      async (span) => {
        await delay(120);
        span.addEvent('cart-validated', { attributes: { itemCount: 3 } });
        const payment = Observe.startSpan('payment', { parent: span });
        await delay(80);
        payment.end({ status: 'ok' });
        pushEntry({
          name: 'payment',
          detail: `child of checkout, trace ${shortId(payment.traceId)}`,
          status: 'ok',
        });
        span.setAttributes({ 'order.total': 129.99 });
        pushEntry({
          name: 'checkout',
          detail: `trace ${shortId(span.traceId)}, ${Math.round(performance.now() - startedAt)} ms`,
          status: 'unset',
        });
      },
      { attributes: { 'cart.items': 3 } }
    );
  }

  // A rejected callback ends the span with an error status carrying the message, then rethrows.
  async function runFailingFlow() {
    try {
      await Observe.withSpan('sync-inventory', async () => {
        await delay(60);
        throw new Error('inventory service unavailable');
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushEntry({ name: 'sync-inventory', detail: message, status: 'error' });
    }
  }

  // Manual lifecycle: hold the handle, enrich it, end it yourself.
  async function runManualSpan() {
    const span = Observe.startSpan('image-decode', {
      attributes: { 'image.format': 'jpeg' },
    });
    await delay(45);
    span.end();
    pushEntry({
      name: 'image-decode',
      detail: `span ${shortId(span.spanId)}, trace ${shortId(span.traceId)}`,
      status: 'unset',
    });
  }

  // One-shot recording of an operation that was measured independently.
  function runRecordSpan() {
    const startTime = Date.now();
    let total = 0;
    for (let index = 0; index < 2_000_000; index++) {
      total += index % 7;
    }
    const endTime = Date.now();
    Observe.recordSpan('busy-loop', {
      startTime,
      endTime,
      attributes: { iterations: 2_000_000, total },
    });
    pushEntry({
      name: 'busy-loop',
      detail: `${endTime - startTime} ms, pre-measured`,
      status: 'unset',
    });
  }

  // Network requests below are captured by the network producer as client spans (when capture
  // is enabled), independently of the fetch result handling here.
  async function fetchWithStatus(label: string, run: () => Promise<unknown>) {
    setNetworkStatus(`${label}...`);
    try {
      await run();
      setNetworkStatus(
        `${label}: done${captureEnabled ? ', span recorded natively' : ', capture disabled'}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNetworkStatus(`${label}: ${message}`);
    }
  }

  function fetchOk() {
    return fetchWithStatus('GET 200', () => fetch('https://httpbin.io/get'));
  }

  function fetchNotFound() {
    // A 4xx response makes the span an error with `error.type` = the status code.
    return fetchWithStatus('GET 404', () => fetch('https://httpbin.io/status/404'));
  }

  function fetchRedirects() {
    // Each hop becomes an `expo.http.redirect` event on the single request span.
    return fetchWithStatus('GET with 2 redirects', () => fetch('https://httpbin.io/redirect/2'));
  }

  function fetchAborted() {
    // An intentional cancellation keeps its span but stays unset, with no `error.type`.
    return fetchWithStatus('Aborted GET', async () => {
      const controller = new AbortController();
      const request = fetch('https://httpbin.io/delay/10', { signal: controller.signal });
      setTimeout(() => controller.abort(), 300);
      await request.catch(() => {});
    });
  }

  // Capture-time gate for network spans. The public knob is `Observe.configure({ traces })` at
  // startup; this internal call demonstrates the same gate live, without re-running configure.
  function toggleNetworkCapture(enabled: boolean) {
    setCaptureEnabled(enabled);
    AppMetrics.setNetworkSpansConfig({ enabled });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        Custom spans are persisted when they end and exported to EAS Observe as OTLP traces,
        alongside spans recorded automatically for network requests.
      </Text>
      <Text style={[styles.heading, { color: theme.text.default }]}>Custom spans</Text>
      <Button
        title="Checkout flow"
        description="withSpan wrapping async work, an event, and a nested child span"
        onPress={runCheckoutFlow}
      />
      <Button
        title="Failing operation"
        description="withSpan ends the span with an error status and rethrows"
        onPress={runFailingFlow}
      />
      <Button
        title="Manual span"
        description="startSpan, enrich the handle, end it yourself"
        onPress={runManualSpan}
      />
      <Button
        title="Pre-measured span"
        description="recordSpan with an explicit start and end time"
        onPress={runRecordSpan}
      />
      <Text style={[styles.heading, { color: theme.text.default }]}>Network spans</Text>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.text.default }]}>
          Capture network requests
        </Text>
        <Switch value={captureEnabled} onValueChange={toggleNetworkCapture} />
      </View>
      <Button title="GET 200" onPress={fetchOk} />
      <Button title="GET 404 (error span)" onPress={fetchNotFound} />
      <Button title="Redirect chain (span events)" onPress={fetchRedirects} />
      <Button title="Aborted request (stays unset)" onPress={fetchAborted} />
      {networkStatus ? (
        <Text style={[styles.status, { color: theme.text.default }]}>{networkStatus}</Text>
      ) : null}
      {ledger.length > 0 ? (
        <>
          <Text style={[styles.heading, { color: theme.text.default }]}>Ended spans</Text>
          {ledger.map((entry, index) => (
            <View key={`${entry.name}-${index}`} style={styles.ledgerRow}>
              <Text style={[styles.ledgerName, { color: theme.text.default }]}>
                {entry.name}
                {entry.status !== 'unset' ? ` (${entry.status})` : ''}
              </Text>
              <Text style={[styles.ledgerDetail, { color: theme.text.secondary }]}>
                {entry.detail}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 14,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  ledgerRow: {
    marginBottom: 8,
  },
  ledgerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ledgerDetail: {
    fontSize: 13,
  },
});
