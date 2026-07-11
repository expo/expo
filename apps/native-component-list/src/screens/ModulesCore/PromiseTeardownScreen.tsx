import { Code } from '@expo/html-elements';
import { useTheme } from 'ThemeProvider';
import { reloadAppAsync } from 'expo';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { ScrollView, StyleSheet, Text } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

/**
 * Reproduces the JSI use-after-free from https://github.com/expo/expo/issues/47454.
 *
 * A batch of in-flight `fetch` requests is kicked off, then `reloadAppAsync()` tears
 * down the runtime while they are still pending. Their promises' JSI values used to
 * be released on whichever background thread completed the request, after Hermes had
 * already been destroyed, crashing in `jsi::Pointer::~Pointer`. Tap the button
 * several times in a Release build on a device to exercise the race.
 */
function reloadWithInFlightWork(requestCount: number, reloadDelayMs: number) {
  for (let i = 0; i < requestCount; i++) {
    fetch(`https://picsum.photos/1200?r=${Math.random()}`)
      .then((response) => response.arrayBuffer())
      .catch(() => {});
  }
  setTimeout(() => {
    reloadAppAsync('Reproducing in-flight promise teardown');
  }, reloadDelayMs);
}

/**
 * Reproduces the `RuntimeScheduler` use-after-free from https://github.com/expo/expo/issues/47315.
 *
 * Both crashes stem from a native async function's promise (which `fetch` above also
 * is) being torn down mid-reload; they differ in timing. #47454 needs a promise that
 * settles late, so its completion handler releases JSI values against a freed runtime.
 * #47315 needs a promise still pending at teardown, so the reload's own rejection
 * dispatches onto a `RuntimeScheduler` the React instance is concurrently freeing,
 * crashing in `dispatchOnReactScheduler`.
 *
 * This pumps a pool of native promises to bias toward the pending-at-teardown state.
 * It is best-effort: the calls used here settle in well under the reload delay, so
 * the pump keeps re-firing to refill the pool, but a deterministic repro would need
 * a native async function that never settles (the issue's `hangForever` module).
 */
function reloadWithPendingNativePromises(poolSize: number, reloadDelayMs: number) {
  const nativeCall = (index: number): Promise<unknown> => {
    switch (index % 3) {
      case 0:
        return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${Math.random()}`);
      case 1:
        return Device.getUptimeAsync();
      default:
        return SecureStore.getItemAsync(`promise-teardown-${index}`);
    }
  };
  let pumping = true;
  let index = 0;
  const pump = () => {
    if (!pumping) {
      return;
    }
    nativeCall(index++)
      .catch(() => {})
      .finally(() => {
        pump();
      });
  };
  for (let i = 0; i < poolSize; i++) {
    pump();
  }
  setTimeout(() => {
    pumping = false;
    reloadAppAsync('Reproducing pending native promise teardown');
  }, reloadDelayMs);
}

const PROMISE_COUNT = 100;
const RELOAD_DELAY_MS = 20;

export default function PromiseTeardownScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView style={styles.scrollView}>
      <HeadingText>In-flight fetch during reload</HeadingText>
      <Text style={[styles.description, { color: theme.text.default }]}>
        {`Fires ${PROMISE_COUNT} fetch requests, then calls `}
        <Code>reloadAppAsync()</Code>
        {` after ${RELOAD_DELAY_MS}ms while they are still pending. Best run in a Release ` +
          `build on a physical device.`}
      </Text>
      <Button
        title="Reload with in-flight fetch"
        onPress={() => {
          reloadWithInFlightWork(PROMISE_COUNT, RELOAD_DELAY_MS);
        }}
      />

      <HeadingText>Pending native promises during reload</HeadingText>
      <Text style={[styles.description, { color: theme.text.default }]}>
        {`Keeps ${PROMISE_COUNT} native async function promises pending, then calls `}
        <Code>reloadAppAsync()</Code>
        {` after ${RELOAD_DELAY_MS}ms so they are rejected mid-teardown. Best run in a ` +
          `Release build on a physical device.`}
      </Text>
      <Button
        title="Reload with pending native promises"
        onPress={() => {
          reloadWithPendingNativePromises(PROMISE_COUNT, RELOAD_DELAY_MS);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
  description: {
    marginBottom: 12,
    textAlign: 'left',
  },
});
