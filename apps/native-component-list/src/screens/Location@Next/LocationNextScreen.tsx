import * as LocationNext from 'expo-location/next';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { setLocationTaskListener } from './locationTask';

const PERMISSION_SHAPE = '{ status, granted, canAskAgain, scope, accuracy, expires }';

const POSITION_SHAPE =
  '{ coordinates: { latitude, longitude }, timestamp, mocked,\n' +
  '  altitude, mslAltitude, speed, heading,\n' +
  '  horizontalAccuracy, verticalAccuracy, speedAccuracy }\n' +
  'Every field except coordinates, timestamp and mocked may be null.';

const NOT_IMPLEMENTED =
  'Not implemented natively on this branch.\n' +
  'Fails immediately with: LocationUpdatesHandle is undefined.';

function Section({
  title,
  note,
  right,
  children,
}: {
  title: string;
  note: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
        {right}
      </View>
      <Text style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{note}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{children}</View>
    </View>
  );
}

// Fixed width and height so every button in the grid matches, regardless of label length.
// Button renders `children` in place of `title`, which is the only way to shrink the label.
function GridButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      style={{ width: '23.5%' }}
      buttonStyle={{ width: '100%', height: 46, paddingHorizontal: 2 }}
      onPress={onPress}>
      <Text
        style={{
          color: '#ffffff',
          fontWeight: '700',
          fontSize: 10,
          textAlign: 'center',
        }}
        numberOfLines={2}>
        {label}
      </Text>
    </Button>
  );
}

// Green only for isSubscribed. Amber covers every state that is recoverable, and the raw
// flags say which one it is; grey means released, the one state you cannot come back from.
// isSubscribed is checked first on purpose: it is the one flag we observe rather than derive,
// so if the provider is feeding us the handle is alive no matter what the others claim.
function describeWatch(status: LocationNext.PositionWatchStatus | null) {
  if (!status) {
    return { color: '#bdbdbd', label: 'no watcher' };
  }
  if (status.isSubscribed) {
    return { color: '#2e7d32', label: 'receiving' };
  }
  if (!status.isHandleAlive) {
    return { color: '#bdbdbd', label: 'released' };
  }
  if (status.isPaused) {
    return { color: '#ed6c02', label: 'paused' };
  }
  if (!status.isStarted) {
    return { color: '#ed6c02', label: 'no listener' };
  }
  if (!status.isInForeground) {
    return { color: '#ed6c02', label: 'backgrounded' };
  }
  return { color: '#ed6c02', label: 'not subscribed' };
}

function WatchIndicator({ status }: { status: LocationNext.PositionWatchStatus | null }) {
  const { color, label } = describeWatch(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: '#00000033',
        }}
      />
      <Text style={{ fontSize: 11, opacity: 0.8 }}>{label}</Text>
    </View>
  );
}

export default function LocationNextScreen() {
  const [output, setOutput] = useState({
    actual: 'No output yet',
    expected: '',
  });
  const [watchStatus, setWatchStatus] = useState<LocationNext.PositionWatchStatus | null>(null);
  const watcher = useRef<LocationNext.PositionWatchHandle | null>(null);
  // Constructed lazily: LocationUpdatesHandle is not implemented natively yet, so building it
  // during render would crash the screen before any of the other buttons can be used.
  const updates = useRef<LocationNext.LocationUpdatesHandle | null>(null);

  useEffect(() => {
    setLocationTaskListener((message) =>
      setOutput({ actual: `[task] ${message}`, expected: NOT_IMPLEMENTED })
    );
    return () => {
      setLocationTaskListener(null);
      watcher.current?.dispose();
      watcher.current = null;
    };
  }, []);

  // Polled rather than tracked locally, so the dot also catches changes the native side makes
  // on its own — it drops the subscription when the activity goes to the background.
  useEffect(() => {
    const id = setInterval(
      () => setWatchStatus(watcher.current ? watcher.current.status() : null),
      1000
    );
    return () => clearInterval(id);
  }, []);

  // Without this the optional chain on a missing watcher yields undefined, which the output
  // pane renders as "done" — indistinguishable from a call that actually succeeded.
  const withWatcher =
    <T,>(action: (handle: LocationNext.PositionWatchHandle) => T) =>
    async () => {
      if (!watcher.current) {
        return 'no watcher yet — press start first';
      }
      return action(watcher.current);
    };

  const run = (label: string, expected: string, action: () => Promise<unknown>) => async () => {
    setOutput({ actual: `[${label}] waiting for the result…`, expected });
    try {
      const result = await action();
      setOutput({
        actual: `[${label}] ${result === undefined ? 'done' : JSON.stringify(result, null, 2)}`,
        expected,
      });
    } catch (error) {
      setOutput({ actual: `[${label}] ${String(error)}`, expected });
      Alert.alert('Error', String(error));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Section
          title="Providers"
          note="Android only — iOS has a single CoreLocation source, so there is nothing to pick. Swap the backend serving positions, then press 'selected name' to confirm. Set this first: every call below uses the selected provider.">
          <GridButton
            label="use GMS"
            onPress={run(
              'provider',
              'done. This is the default, so it is a no-op on a fresh screen.\n"selected name" then returns "GMS".\nNeeds Google Play Services on the device.',
              async () => LocationNext.setLocationProvider(LocationNext.LocationProvider.Gms())
            )}
          />
          <GridButton
            label="use Android"
            onPress={run(
              'provider',
              'done. "selected name" then returns "Android".\nTalks to LocationManager directly, so it also works with no Play Services.',
              async () => LocationNext.setLocationProvider(LocationNext.LocationProvider.Android())
            )}
          />
          <GridButton
            label="use Fallback"
            onPress={run(
              'provider',
              'done. "selected name" then returns\n"Fallback: GMS -> Android".\nEach call tries GMS first and drops to Android only when GMS reports itself unavailable.',
              async () =>
                LocationNext.setLocationProvider(
                  LocationNext.LocationProvider.Fallback([
                    LocationNext.LocationProvider.Gms(),
                    LocationNext.LocationProvider.Android(),
                  ])
                )
            )}
          />
          <GridButton
            label="selected name"
            onPress={run(
              'provider',
              'Synchronous, returns immediately.\n"GMS" by default. "Android", or\n"Fallback: GMS -> Android" after setLocationProvider.',
              async () => LocationNext.getSelectedLocationProviderName()
            )}
          />
        </Section>

        <Section
          title="Permissions"
          note="Grant foreground access first — getPosition and watchPosition both refuse without it.">
          <GridButton
            label="get foreground"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nReturns immediately; no dialog.\nBefore any request: status "undetermined", granted false, scope "notGranted".`,
              LocationNext.getForegroundPermissionsAsync
            )}
          />
          <GridButton
            label="request foreground"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nResolves once you answer the system dialog.\nAfter Allow: status "granted", granted true, scope "whenInUse", accuracy "full".`,
              () => LocationNext.requestForegroundPermissionsAsync()
            )}
          />
          <GridButton
            label="get background"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nReturns immediately; no dialog.\nscope "always" only once background access is granted.`,
              LocationNext.getBackgroundPermissionsAsync
            )}
          />
          <GridButton
            label="request background"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nAndroid 11+ cannot prompt directly. Expect "denied" until\n"Allow all the time" is set in Settings.`,
              LocationNext.requestBackgroundPermissionsAsync
            )}
          />
        </Section>

        <Section title="Position" note="A single fix, using the currently selected provider.">
          <GridButton
            label="getPosition"
            onPress={run(
              'position',
              `${POSITION_SHAPE}\nAsks for AUTOMOTIVE_NAVIGATION (high accuracy) and no cached fix.\nUp to the 90s native timeout. null if no fix is available.`,
              () =>
                LocationNext.getPosition({
                  profile: LocationNext.LocationProfile.AUTOMOTIVE_NAVIGATION,
                  maxCachedAge: 0,
                })
            )}
          />
        </Section>

        <Section
          title="Watcher"
          note="start creates the watcher; the rest act on that one handle. The dot tracks isSubscribed; only dispose turns it grey."
          right={<WatchIndicator status={watchStatus} />}>
          <GridButton
            label="start"
            onPress={run(
              'watcher',
              'done right away, then a Position as fast as the device supplies one.\n' +
                'AUTOMOTIVE_NAVIGATION (high accuracy) with the interval pushed to 0.5s.\nThe first fix can still take several seconds.',
              async () => {
                watcher.current?.dispose();
                watcher.current = null;
                const handle = LocationNext.watchPosition({
                  profile: LocationNext.LocationProfile.AUTOMOTIVE_NAVIGATION,
                  onPosition: (position) =>
                    setOutput({
                      actual: `[watcher] ${JSON.stringify(position, null, 2)}`,
                      expected: POSITION_SHAPE,
                    }),
                  onError: (error) =>
                    setOutput({
                      actual: `[watcher] ${error}`,
                      expected: 'An error string from the provider.',
                    }),
                });
                // The profile caps out at 1s; withInterval stages a faster one and restart
                // re-subscribes with it.
                handle.withInterval(0.5).restart();
                watcher.current = handle;
              }
            )}
          />
          <GridButton
            label="pause"
            onPress={run(
              'watcher',
              'done. Updates stop, the dot goes amber.\nisSubscribed false, isPaused true, isHandleAlive still true.',
              withWatcher((handle) => handle.pause())
            )}
          />
          <GridButton
            label="resume"
            onPress={run(
              'watcher',
              'Immediate. true if it re-subscribed, false if it could not.',
              withWatcher((handle) => handle.resume())
            )}
          />
          <GridButton
            label="status"
            onPress={run(
              'watcher',
              'Immediate. { isSubscribed, isHandleAlive, isStarted, isPaused, isInForeground }.\nisSubscribed = sending now; isHandleAlive = can be made to send again.',
              withWatcher((handle) => handle.status())
            )}
          />
          <GridButton
            label="restart"
            onPress={run(
              'watcher',
              'Immediate. true if it re-subscribed with the staged parameters,\nfalse if nothing changed.',
              withWatcher((handle) => handle.restart())
            )}
          />
          <GridButton
            label="dispose"
            onPress={run(
              'watcher',
              'done. isHandleAlive goes false — the one state the handle cannot come back from.',
              async () => {
                watcher.current?.dispose();
                watcher.current = null;
              }
            )}
          />
        </Section>

        <Section
          title="Location services"
          note="The system location toggle, not a permission. The prompt differs per provider, so pick one above first.">
          <GridButton
            label="is enabled?"
            onPress={run(
              'services',
              'true or false. Synchronous, so it returns immediately.\nReports the device toggle, independent of app permissions.',
              async () => LocationNext.hasLocationServicesEnabled()
            )}
          />
          <GridButton
            label="enable"
            onPress={run(
              'services',
              'true immediately if services are already on.\n' +
                'GMS provider: an in-app "Turn on location?" dialog — true on OK, false on No thanks.\n' +
                'Android provider: leaves the app for the system Settings screen; the result arrives when you navigate back.\n' +
                'Throws if a prompt is already pending.',
              async () => LocationNext.enableLocationServices()
            )}
          />
        </Section>

        <Section
          title="Background updates"
          note="Durable background task. The native side is not part of this branch, so both buttons are expected to fail.">
          <GridButton
            label="updates start"
            onPress={run('updates', NOT_IMPLEMENTED, () => {
              updates.current ??= new LocationNext.LocationUpdatesHandle();
              return updates.current.start();
            })}
          />
          <GridButton
            label="updates stop"
            onPress={run('updates', NOT_IMPLEMENTED, () => {
              updates.current ??= new LocationNext.LocationUpdatesHandle();
              return updates.current.stop();
            })}
          />
        </Section>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 16,
          borderTopWidth: 4,
          borderTopColor: Colors.border,
        }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Actual</Text>
          <Text style={{ fontSize: 11 }}>{output.actual}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Expected</Text>
          <Text style={{ fontSize: 11 }}>{output.expected || '—'}</Text>
        </View>
      </View>
    </View>
  );
}
