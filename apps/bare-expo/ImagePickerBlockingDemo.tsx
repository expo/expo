import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { addSelectionFinishedListener } from 'imagePickerEvents';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Demo: reproduces the `expo-image-picker` "blocked while awaiting" problem for the
 * `onSelectionFinished` PR.
 *
 * With plain `launchImageLibraryAsync`, the returned promise resolves only AFTER every
 * selected asset has been materialized — and for iCloud-offloaded originals that means
 * downloading them over the network first. There is no event for the moment the user
 * finishes selecting / the picker dismisses, so an app that wants to navigate to a
 * "choose destination" screen at that moment has only one option: push it on a guessed
 * timer behind the OS picker. The destination screen then sits in a loading state for an
 * unknown duration, unable to tell "user is still choosing" from "picker closed, now
 * downloading". That gap is what `onSelectionFinished` fixes.
 *
 * To see it: tap "Pick & Upload", then pick a photo/video that is NOT downloaded to this
 * device (offloaded to iCloud — e.g. enable Settings → Photos → "Optimize iPhone
 * Storage", or choose a large video you haven't opened recently). Watch the "Upload media"
 * screen stay on the spinner until the download finishes.
 */

// The real app's workaround: push the destination screen behind the OS picker shortly
// after launching, because there's no selection/dismissal event to push on.
const PUSH_DELAY_MS = 600;

type Phase = 'idle' | 'awaitingMedia' | 'ready' | 'canceled' | 'error';

type LogEntry = { t: number; msg: string };

type DemoState = {
  phase: Phase;
  assets: ImagePicker.ImagePickerAsset[];
  startedAt: number | null;
  resolvedAt: number | null;
  errorMessage: string | null;
  log: LogEntry[];
};

type DemoContextValue = DemoState & {
  begin: () => void;
  setReady: (assets: ImagePicker.ImagePickerAsset[]) => void;
  setCanceled: () => void;
  setError: (message: string) => void;
  reset: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo must be used inside the demo provider');
  }
  return ctx;
}

const INITIAL: DemoState = {
  phase: 'idle',
  assets: [],
  startedAt: null,
  resolvedAt: null,
  errorMessage: null,
  log: [],
};

function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(INITIAL);

  const begin = useCallback(() => {
    setState({
      ...INITIAL,
      phase: 'awaitingMedia',
      startedAt: Date.now(),
      log: [{ t: 0, msg: 'Tapped "Pick & Upload" → launching system picker' }],
    });
  }, []);

  const setReady = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    setState((s) => {
      const now = Date.now();
      const t = s.startedAt ? now - s.startedAt : 0;
      return {
        ...s,
        phase: 'ready',
        assets,
        resolvedAt: now,
        log: [
          ...s.log,
          { t, msg: `launchImageLibraryAsync RESOLVED with ${assets.length} asset(s) — media can finally render` },
        ],
      };
    });
  }, []);

  const setCanceled = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: 'canceled',
      log: [...s.log, { t: s.startedAt ? Date.now() - s.startedAt : 0, msg: 'Picker canceled' }],
    }));
  }, []);

  const setError = useCallback((message: string) => {
    setState((s) => ({
      ...s,
      phase: 'error',
      errorMessage: message,
      log: [...s.log, { t: s.startedAt ? Date.now() - s.startedAt : 0, msg: `Error: ${message}` }],
    }));
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  const value = useMemo<DemoContextValue>(
    () => ({ ...state, begin, setReady, setCanceled, setError, reset }),
    [state, begin, setReady, setCanceled, setError, reset]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

function HomeScreen() {
  const navigation = useNavigation<any>();
  const demo = useDemo();

  const handlePick = useCallback(async () => {
    if (demo.phase === 'awaitingMedia') {
      return;
    }
    demo.begin();
    const selectionFinishedListener = addSelectionFinishedListener(() => navigation.navigate('UploadDemo'));

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'livePhotos'],
        allowsMultipleSelection: true,
        selectionLimit: 50,
        quality: 1,
        exif: true,
        // Force iCloud-offloaded originals to download so the delay is real and visible.
        shouldDownloadFromNetwork: true,
      });


      if (result.canceled) {
        return;
      }


      demo.setReady(result.assets);
    } catch (e: any) {

      demo.setError(e?.message ?? String(e));
    }
    selectionFinishedListener.remove();
  }, [demo, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>iCloud picker blocking demo</Text>
      <Text style={styles.p}>
        Tap below, then pick a photo or video that is <Text style={styles.bold}>offloaded to iCloud</Text>{' '}
        (not downloaded to this device). The "Upload media" screen appears almost immediately, but the
        selected media won&apos;t render until <Text style={styles.code}>launchImageLibraryAsync</Text>{' '}
        finishes downloading the originals.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handlePick}>
        <Text style={styles.buttonText}>Pick &amp; Upload</Text>
      </Pressable>

      <Pressable style={styles.linkButton} onPress={demo.reset}>
        <Text style={styles.linkButtonText}>Reset demo state</Text>
      </Pressable>

      <View style={styles.callout}>
        <Text style={styles.calloutText}>
          ⚠️ With plain expo-image-picker there is no event for when the picker closed, so the upload
          screen below cannot tell &quot;still choosing&quot; from &quot;downloading&quot;. That missing
          signal is what the <Text style={styles.code}>onSelectionFinished</Text> PR adds.
        </Text>
      </View>

      <EventLog />
    </ScrollView>
  );
}

function UploadScreen() {
  const navigation = useNavigation<any>();
  const demo = useDemo();
  const [now, setNow] = useState(() => Date.now());

  // Live timer while we wait for the picker promise to resolve.
  useEffect(() => {
    if (demo.phase !== 'awaitingMedia') {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [demo.phase]);

  // If the user canceled (resolved after we'd already pushed this screen), bounce back.
  useEffect(() => {
    if (demo.phase === 'canceled') {
      navigation.navigate('HomeDemo');
    }
  }, [demo.phase, navigation]);

  const waiting = demo.phase === 'awaitingMedia';
  const end = waiting ? now : (demo.resolvedAt ?? now);
  const elapsed = demo.startedAt ? Math.max(0, (end - demo.startedAt) / 1000) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Upload to</Text>
      <View style={styles.select}>
        <Text style={styles.selectText}>Camera Roll Backup ▾</Text>
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Selected media</Text>

      {waiting && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Waiting for media to load… {elapsed.toFixed(1)}s</Text>
          <Text style={styles.loadingHint}>
            The picker may have already closed — we have no way to know. We&apos;re blocked on the
            promise while the originals download from iCloud.
          </Text>
        </View>
      )}

      {demo.phase === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Failed to load media: {demo.errorMessage}</Text>
        </View>
      )}

      {demo.phase === 'ready' && (
        <>
          <Text style={styles.readyText}>
            {demo.assets.length} item(s) • appeared after {elapsed.toFixed(1)}s
          </Text>
          <View style={styles.grid}>
            {demo.assets.map((asset, i) => (
              <MediaTile key={asset.assetId ?? asset.uri ?? String(i)} asset={asset} />
            ))}
          </View>
        </>
      )}

      <EventLog />

      <Pressable style={styles.linkButton} onPress={() => navigation.navigate('HomeDemo')}>
        <Text style={styles.linkButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

function MediaTile({ asset }: { asset: ImagePicker.ImagePickerAsset }) {
  const isImage = asset.type === 'image' || asset.type === 'livePhoto' || asset.type == null;
  if (isImage && asset.uri) {
    return <Image source={{ uri: asset.uri }} style={styles.tile} />;
  }
  return (
    <View style={[styles.tile, styles.tilePlaceholder]}>
      <Text style={styles.tilePlaceholderText}>{asset.type === 'video' ? '▶' : '?'}</Text>
      <Text style={styles.tileCaption} numberOfLines={1}>
        {asset.fileName ?? asset.type ?? 'asset'}
      </Text>
    </View>
  );
}

function EventLog() {
  const demo = useDemo();
  if (demo.log.length === 0) {
    return null;
  }
  return (
    <View style={styles.log}>
      <Text style={styles.logTitle}>Event log</Text>
      {demo.log.map((entry, i) => (
        <Text key={i} style={styles.logLine}>
          <Text style={styles.logTime}>+{(entry.t / 1000).toFixed(2)}s </Text>
          {entry.msg}
        </Text>
      ))}
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function ImagePickerBlockingDemo() {
  return (
    <DemoProvider>
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: true }}>
        <Stack.Screen name="HomeDemo" component={HomeScreen} options={{ title: 'iCloud Picker Demo' }} />
        <Stack.Screen name="UploadDemo" component={UploadScreen} options={{ title: 'Upload media' }} />
      </Stack.Navigator>
    </DemoProvider>
  );
}

// Lets MainNavigator render it as a bottom tab (it reads `component.navigationOptions`).
(ImagePickerBlockingDemo as any).navigationOptions = { title: 'Picker Demo' };

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  p: { fontSize: 15, lineHeight: 21, color: '#333' },
  bold: { fontWeight: '700' },
  code: { fontFamily: 'Courier', fontSize: 13 },
  button: {
    backgroundColor: '#4630EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { paddingVertical: 10, alignItems: 'center' },
  linkButtonText: { color: '#4630EB', fontSize: 15, fontWeight: '500' },
  callout: { backgroundColor: '#FFF6E0', borderRadius: 10, padding: 12 },
  calloutText: { fontSize: 13, lineHeight: 19, color: '#6b5300' },
  label: { fontSize: 13, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  select: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },
  selectText: { fontSize: 16 },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  loadingText: { fontSize: 16, fontWeight: '600' },
  loadingHint: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  errorBox: { backgroundColor: '#FDE8E8', borderRadius: 10, padding: 14, marginTop: 10 },
  errorText: { color: '#9b1c1c', fontSize: 14 },
  readyText: { fontSize: 14, color: '#333', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tile: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  tilePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  tilePlaceholderText: { fontSize: 28, color: '#666' },
  tileCaption: { fontSize: 10, color: '#888', paddingHorizontal: 4 },
  log: { backgroundColor: '#0d1117', borderRadius: 10, padding: 12, marginTop: 16, gap: 4 },
  logTitle: { color: '#8b949e', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  logLine: { color: '#c9d1d9', fontSize: 12, fontFamily: 'Courier', lineHeight: 17 },
  logTime: { color: '#58a6ff' },
});
