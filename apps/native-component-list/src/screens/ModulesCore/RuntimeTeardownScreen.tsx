import { Code } from '@expo/html-elements';
import { useTheme } from 'ThemeProvider';
import { NativeModule, reloadAppAsync, requireOptionalNativeModule } from 'expo';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

type NativeModulesTester = NativeModule & {
  suspendWithArguments(
    label: string,
    payload: object,
    items: object[],
    delayMs: number
  ): Promise<string>;
};

// iOS-only inline module (see `./NativeModulesTester.swift`), absent when not built into the app.
const nativeModulesTester = requireOptionalNativeModule<NativeModulesTester>('NativeModulesTester');

/**
 * Reproduces the JSI use-after-free from https://github.com/expo/expo/issues/47454.
 * Fires in-flight `fetch` requests, then reloads while they are pending; their promises'
 * JSI values used to be released on the completing background thread after Hermes was
 * already destroyed, crashing in `jsi::Pointer::~Pointer`.
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
 * Reproduces the `RuntimeScheduler` use-after-free from https://github.com/expo/expo/issues/47315,
 * where a native promise still pending at teardown has the reload's rejection dispatched onto a
 * `RuntimeScheduler` the React instance is concurrently freeing, crashing in `dispatchOnReactScheduler`.
 * Pumps a pool of native promises to bias toward that state; best-effort, since these calls settle
 * fast (a deterministic repro needs an async function that never settles).
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

/**
 * Reproduces the `JavaScriptValuesBuffer` use-after-free from
 * https://github.com/expo/expo/issues/47716. Unlike the scenarios above, whose calls
 * settle too fast to be pending at teardown, `suspendWithArguments` stays suspended so
 * every call is mid-flight when the reload lands, still holding the large decoded
 * arguments whose buffer used to be released against the freed runtime.
 */
function makePayload(index: number) {
  return {
    index,
    text: `payload-${index}-${'x'.repeat(10_000)}`,
    nested: { a: Math.random(), b: Math.random(), label: `nested-${index}` },
    list: Array.from({ length: 50 }, (_, itemIndex) => ({
      itemIndex,
      value: Math.random(),
      label: `item-${index}-${itemIndex}`,
    })),
  };
}

function reloadWithSuspendedAsyncCalls(
  callCount: number,
  nativeDelayMs: number,
  reloadDelayMs: number
) {
  if (!nativeModulesTester) {
    return;
  }
  for (let i = 0; i < callCount; i++) {
    const payload = makePayload(i);
    nativeModulesTester
      .suspendWithArguments(`call-${i}`, payload, payload.list, nativeDelayMs)
      .catch(() => {});
  }
  setTimeout(() => {
    reloadAppAsync('Reproducing arguments buffer teardown during async module calls');
  }, reloadDelayMs);
}

const PROMISE_COUNT = 100;
const RELOAD_DELAY_MS = 20;
const SUSPENDED_CALL_COUNT = 500;
const NATIVE_DELAY_MS = 2500;

export default function RuntimeTeardownScreen() {
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

      <View style={!nativeModulesTester && styles.disabledSection}>
        <HeadingText>Suspended async module calls during reload</HeadingText>
        <Text style={[styles.description, { color: theme.text.default }]}>
          {`Fires ${SUSPENDED_CALL_COUNT} async module calls with large arguments that stay ` +
            `suspended for ${NATIVE_DELAY_MS}ms natively, then calls `}
          <Code>reloadAppAsync()</Code>
          {` after ${RELOAD_DELAY_MS}ms so they are all pending at teardown. Best run in a ` +
            `Release build on a physical device.`}
          {!nativeModulesTester &&
            ' Requires the NativeModulesTester inline module, which is only built into iOS.'}
        </Text>
        <Button
          title="Reload with suspended async calls"
          disabled={!nativeModulesTester}
          onPress={() => {
            reloadWithSuspendedAsyncCalls(SUSPENDED_CALL_COUNT, NATIVE_DELAY_MS, RELOAD_DELAY_MS);
          }}
        />
      </View>
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
  disabledSection: {
    opacity: 0.4,
  },
});
