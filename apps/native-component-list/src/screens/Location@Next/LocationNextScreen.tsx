import {
  Location,
  LocationProfile,
  LocationProvider,
  LocationUpdatesHandle,
  PositionWatchHandle,
  type BackgroundTaskStatus,
  type Position,
  type PositionWatchStatus,
} from 'expo-location/next';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import {
  clearBackgroundFixesAsync,
  getBackgroundFixesAsync,
  type BackgroundFixEntry,
} from './backgroundLocationStore';
import { setLocationTaskListener } from './locationTask';

const PERMISSION_SHAPE = '{ status, granted, canAskAgain, scope, accuracy, expires }';

const POSITION_SHAPE =
  '{ coordinates: { latitude, longitude }, timestamp, mocked,\n' +
  '  altitude, mslAltitude, speed, heading,\n' +
  '  horizontalAccuracy, verticalAccuracy, speedAccuracy }\n' +
  'Every field except coordinates, timestamp and mocked may be null.';

const NOTIFICATION_PERMISSION_SHAPE = '{ status, granted, canAskAgain, expires }';

const SESSION_SHAPE = '{ state, stopOnTaskRemoved, unthrottled }';

const TASK_STATUS_SHAPE = '{ isRegistered, isRunning, lastError, lastFixAt }';

const BACKGROUND_PROFILES: { label: string; profile: LocationProfile }[] = [
  { label: 'default', profile: LocationProfile.DEFAULT },
  { label: 'automotive', profile: LocationProfile.AUTOMOTIVE_NAVIGATION },
  { label: 'other nav', profile: LocationProfile.OTHER_NAVIGATION },
  { label: 'fitness', profile: LocationProfile.FITNESS },
  { label: 'airborne', profile: LocationProfile.AIRBORNE },
  { label: 'low power', profile: LocationProfile.LOW_POWER },
];

type LoggedFix = {
  n: number;
  latitude: number;
  longitude: number;
  at: number;
  source: string;
};

function formatClock(at: number) {
  const d = new Date(at);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Newest on the left, so the interesting end is the one you see without scrolling.
function FixHistory({ fixes }: { fixes: LoggedFix[] }) {
  if (fixes.length === 0) {
    return <Text style={{ fontSize: 11, marginTop: 6 }}>No fixes recorded yet.</Text>;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8 }}
      contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
      {fixes.map((fix) => (
        <View key={fix.n} style={{ minWidth: 104 }}>
          <Text style={{ fontSize: 11, fontWeight: '700' }}>{`#${fix.n} ${fix.source}`}</Text>
          <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
            {fix.latitude.toFixed(5)}
          </Text>
          <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
            {fix.longitude.toFixed(5)}
          </Text>
          <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>{formatClock(fix.at)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function BackgroundStatusView({ status }: { status: BackgroundTaskStatus | null }) {
  if (!status) {
    return (
      <Text style={{ fontSize: 11, marginTop: 6, width: '100%' }}>
        {'Status not read yet — press "updates status".'}
      </Text>
    );
  }
  return (
    <View style={{ width: '100%', marginTop: 8 }}>
      <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
        isRegistered: {String(status.isRegistered)}
      </Text>
      <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
        isRunning: {String(status.isRunning)}
      </Text>
      <Text style={{ fontSize: 11 }}>lastError: {status.lastError ?? '—'}</Text>
      <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
        lastFixAt: {status.lastFixAt == null ? '—' : formatClock(status.lastFixAt)}
      </Text>
    </View>
  );
}

// "held" is the gap between the fix timestamp and the moment the task callback ran, which is the
// only way to see the provider batching deliveries.
function BackgroundFixHistory({ entries }: { entries: BackgroundFixEntry[] }) {
  if (entries.length === 0) {
    return (
      <Text style={{ fontSize: 11, marginTop: 6, width: '100%' }}>
        No background fixes recorded yet.
      </Text>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8 }}
      contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
      {entries.map((entry, index) => {
        const heldForSeconds = (entry.arrivedAt - entry.fixedAt) / 1000;
        return (
          <View key={`${entry.arrivedAt}-${index}`} style={{ minWidth: 112 }}>
            <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {entry.lat.toFixed(5)}
            </Text>
            <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {entry.lon.toFixed(5)}
            </Text>
            <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {`fix ${formatClock(entry.fixedAt)}`}
            </Text>
            <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {`got ${formatClock(entry.arrivedAt)}`}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontVariant: ['tabular-nums'],
                color: heldForSeconds <= 10 ? '#2e7d32' : '#ed6c02',
              }}>
              {`held ${heldForSeconds.toFixed(1)}s`}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function Section({
  title,
  note,
  right,
  children,
  footer,
}: {
  title: string;
  note: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
      {footer}
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
function describeWatch(status: PositionWatchStatus | null) {
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

function WatchIndicator({ status }: { status: PositionWatchStatus | null }) {
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
  const [watchStatus, setWatchStatus] = useState<PositionWatchStatus | null>(null);
  const watcher = useRef<PositionWatchHandle | null>(null);
  const updates = useRef<LocationUpdatesHandle | null>(null);
  const fixCount = useRef(0);
  const [fixes, setFixes] = useState<LoggedFix[]>([]);
  const [showFixes, setShowFixes] = useState(false);
  const [backgroundProfile, setBackgroundProfile] = useState(LocationProfile.DEFAULT);
  const [backgroundStatus, setBackgroundStatus] = useState<BackgroundTaskStatus | null>(null);
  const [backgroundFixes, setBackgroundFixes] = useState<BackgroundFixEntry[]>([]);
  const [showBackgroundFixes, setShowBackgroundFixes] = useState(false);

  const refreshBackgroundFixesAsync = async () => {
    setBackgroundFixes(await getBackgroundFixesAsync());
  };

  // The task writes while the screen is gone, so re-read on focus rather than on mount.
  useFocusEffect(
    useCallback(() => {
      refreshBackgroundFixesAsync();
    }, [])
  );

  // Every Position the screen sees goes through here, whatever produced it.
  const recordFix = (position: Position, source: string) => {
    fixCount.current += 1;
    setFixes((previous) =>
      [
        {
          n: fixCount.current,
          latitude: position.coordinates.latitude,
          longitude: position.coordinates.longitude,
          at: Date.now(),
          source,
        },
        ...previous,
      ].slice(0, 200)
    );
  };

  useEffect(() => {
    setLocationTaskListener((message) =>
      setOutput({ actual: `[task] ${message}`, expected: 'One call per delivered position.' })
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
    <T,>(action: (handle: PositionWatchHandle) => T) =>
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
              async () => Location.setLocationProvider(LocationProvider.Gms())
            )}
          />
          <GridButton
            label="use Android"
            onPress={run(
              'provider',
              'done. "selected name" then returns "Android".\nTalks to LocationManager directly, so it also works with no Play Services.',
              async () => Location.setLocationProvider(LocationProvider.Android())
            )}
          />
          <GridButton
            label="use Fallback"
            onPress={run(
              'provider',
              'done. "selected name" then returns\n"Fallback: GMS -> Android".\nEach call tries GMS first and drops to Android only when GMS reports itself unavailable.',
              async () =>
                Location.setLocationProvider(
                  LocationProvider.Fallback([LocationProvider.Gms(), LocationProvider.Android()])
                )
            )}
          />
          <GridButton
            label="selected name"
            onPress={run(
              'provider',
              'Synchronous, returns immediately.\n"GMS" by default. "Android", or\n"Fallback: GMS -> Android" after setLocationProvider.',
              async () => Location.getSelectedLocationProviderName()
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
              Location.getForegroundPermissions
            )}
          />
          <GridButton
            label="request foreground"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nResolves once you answer the system dialog.\nAfter Allow: status "granted", granted true, scope "whenInUse", accuracy "full".`,
              () => Location.requestForegroundPermissions()
            )}
          />
          <GridButton
            label="get background"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nReturns immediately; no dialog.\nscope "always" only once background access is granted.`,
              Location.getBackgroundPermissions
            )}
          />
          <GridButton
            label="request background"
            onPress={run(
              'permissions',
              `${PERMISSION_SHAPE}\nAndroid 11+ cannot prompt directly. Expect "denied" until\n"Allow all the time" is set in Settings.`,
              Location.requestBackgroundPermissions
            )}
          />
          <GridButton
            label="get notification"
            onPress={run(
              'permissions',
              `${NOTIFICATION_PERMISSION_SHAPE}\nReturns immediately; no dialog.\nGoverns only whether the foreground service notification is visible.`,
              Location.getNotificationPermissions
            )}
          />
          <GridButton
            label="request notification"
            onPress={run(
              'permissions',
              `${NOTIFICATION_PERMISSION_SHAPE}\nShows a dialog on Android 13 and later.\nThe foreground service runs whether or not this is granted.`,
              Location.requestNotificationPermissions
            )}
          />
        </Section>

        <Section title="Position" note="A single fix, using the currently selected provider.">
          <GridButton
            label="getPosition"
            onPress={run(
              'position',
              `${POSITION_SHAPE}\nAsks for AUTOMOTIVE_NAVIGATION (high accuracy) and no cached fix.\nUp to the 90s native timeout. null if no fix is available.`,
              async () => {
                const position = await Location.getPosition({
                  profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
                  maxCachedAge: 0,
                });
                if (position) {
                  recordFix(position, 'getPosition');
                }
                return position;
              }
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
                const handle = Location.watchPosition({
                  profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
                  onPosition: (position) => {
                    recordFix(position, 'watcher');
                    setOutput({
                      actual: `[watcher] ${JSON.stringify(position, null, 2)}`,
                      expected: POSITION_SHAPE,
                    });
                  },
                  onError: (error) =>
                    setOutput({
                      actual: `[watcher] ${error.code}: ${error.message}`,
                      expected: 'An error code and message from the provider.',
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
              async () => Location.hasLocationServicesEnabled()
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
              async () => Location.enableLocationServices()
            )}
          />
        </Section>

        <Section
          title="Background updates"
          note="Durable background task. Positions arrive through the task listener and are written to storage, so they survive the process dying. Pick a profile first: it sets both the update interval and the delay the provider may batch fixes by."
          right={
            <Text style={{ fontSize: 11, opacity: 0.8 }}>{`profile: ${backgroundProfile}`}</Text>
          }
          footer={<BackgroundStatusView status={backgroundStatus} />}>
          {BACKGROUND_PROFILES.map(({ label, profile }) => (
            <GridButton
              key={profile}
              label={backgroundProfile === profile ? `• ${label}` : label}
              onPress={() => setBackgroundProfile(profile)}
            />
          ))}
          <GridButton
            label="updates start"
            onPress={run(
              'updates',
              'Registers the task; resolves with nothing.\n' +
                'Throws without the background permission, or without\n' +
                'RECEIVE_BOOT_COMPLETED in the merged manifest.',
              () => {
                updates.current ??= new LocationUpdatesHandle();
                return updates.current.withProfile(backgroundProfile).start();
              }
            )}
          />
          <GridButton
            label="updates stop"
            onPress={run(
              'updates',
              'Unregisters the task; resolves with nothing.\nDoes nothing when no task is registered.',
              () => {
                updates.current ??= new LocationUpdatesHandle();
                return updates.current.stop();
              }
            )}
          />
          <GridButton
            label="updates status"
            onPress={run(
              'updates',
              `${TASK_STATUS_SHAPE}\nProcess-local: lastError and lastFixAt reset when the process is recreated,\neven while the task stays registered.`,
              async () => {
                updates.current ??= new LocationUpdatesHandle();
                const status = updates.current.status();
                setBackgroundStatus(status);
                return status;
              }
            )}
          />
        </Section>

        <Section
          title="Foreground session"
          note="Keeps background tasks unthrottled and watchers alive while the app is backgrounded. Start it from the foreground.">
          <GridButton
            label="session start"
            onPress={run(
              'session',
              'Resolves once the service is promoted.\n' +
                'A notification appears when POST_NOTIFICATIONS is granted; the service runs either way.\n' +
                'Throws when no service is running and the app is in the background.',
              () =>
                Location.ensureBackgroundSessionStarted({
                  notificationTitle: 'Tracking your route',
                  notificationBody: 'Tap to return to the app',
                })
            )}
          />
          <GridButton
            label="session stop"
            onPress={run(
              'session',
              'Stops the service and clears the persisted configuration,\nso it is not restarted when the app next enters the foreground.',
              () => Location.stopBackgroundSession()
            )}
          />
          <GridButton
            label="session status"
            onPress={run(
              'session',
              `${SESSION_SHAPE}\nstate "PROMOTED" while running, "NOT_RUNNING" after stop.\nunthrottled is true while promoted, and always true below Android 8.`,
              async () => Location.getBackgroundSessionStatus()
            )}
          />
        </Section>

        <Section
          title="Background fix history"
          note="Every fix the background task wrote to storage, newest first. 'held' is the gap between the fix timestamp and the moment the callback ran, so a large gap means the provider batched the delivery. Reloaded whenever the screen regains focus."
          footer={showBackgroundFixes ? <BackgroundFixHistory entries={backgroundFixes} /> : null}>
          <GridButton
            label={showBackgroundFixes ? 'hide list' : `show list (${backgroundFixes.length})`}
            onPress={() => {
              refreshBackgroundFixesAsync();
              setShowBackgroundFixes((previous) => !previous);
            }}
          />
          <GridButton label="refresh list" onPress={() => refreshBackgroundFixesAsync()} />
          <GridButton
            label="clear list"
            onPress={async () => {
              await clearBackgroundFixesAsync();
              setBackgroundFixes([]);
            }}
          />
        </Section>

        <Section
          title="Fix history"
          note="Every Position this screen has received, newest first, from the watcher and from getPosition. Useful for eyeballing the real interval between fixes."
          footer={showFixes ? <FixHistory fixes={fixes} /> : null}>
          <GridButton
            label={showFixes ? 'hide list' : `show list (${fixes.length})`}
            onPress={() => setShowFixes((previous) => !previous)}
          />
          <GridButton
            label="clear list"
            onPress={() => {
              fixCount.current = 0;
              setFixes([]);
            }}
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
