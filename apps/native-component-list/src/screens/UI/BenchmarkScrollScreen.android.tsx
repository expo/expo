import { Column, Host, Row, Text as ComposeText } from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxSize,
  fillMaxWidth,
  height as heightModifier,
  paddingAll,
  verticalScroll,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import {
  Pressable,
  ScrollView as RNScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

type Variant = 'expo-ui' | 'rn';
const ITEM_COUNTS = [100, 500, 1000, 5000] as const;
const COLORS = [
  '#FF6B6B',
  '#FF8E53',
  '#FFC53D',
  '#52C41A',
  '#36CFC9',
  '#4096FF',
  '#9254DE',
  '#F759AB',
];

type ContentProps = { count: number; onMounted: (ms: number) => void };

function useMountNotifier(onMounted: (ms: number) => void) {
  const startRef = React.useRef(performance.now());
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      onMounted(performance.now() - startRef.current);
    });
    return () => cancelAnimationFrame(id);
  }, [onMounted]);
}

function ExpoUIContent({ count, onMounted }: ContentProps) {
  useMountNotifier(onMounted);
  return (
    <Host style={{ flex: 1 }}>
      <Column
        verticalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxSize(), verticalScroll()]}>
        {Array.from({ length: count }, (_, i) => (
          <Row
            key={i}
            verticalAlignment="center"
            modifiers={[
              fillMaxWidth(),
              heightModifier(60),
              background(COLORS[i % COLORS.length]),
              paddingAll(8),
            ]}>
            <ComposeText color="#FFFFFF" style={{ typography: 'titleMedium' }}>
              {`Item ${i}`}
            </ComposeText>
          </Row>
        ))}
      </Column>
    </Host>
  );
}

function RNContent({ count, onMounted }: ContentProps) {
  useMountNotifier(onMounted);
  return (
    <RNScrollView contentContainerStyle={styles.rnContainer}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[styles.rnItem, { backgroundColor: COLORS[i % COLORS.length] }]}>
          <Text style={styles.rnItemText}>{`Item ${i}`}</Text>
        </View>
      ))}
    </RNScrollView>
  );
}

function useFpsCounter() {
  const [fps, setFps] = React.useState(0);
  React.useEffect(() => {
    let rafId = 0;
    let frames = 0;
    let last = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      const elapsed = now - last;
      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        last = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return fps;
}

export default function BenchmarkScrollScreen() {
  const [variant, setVariant] = React.useState<Variant>('expo-ui');
  const [count, setCount] = React.useState<number>(1000);
  const [remount, setRemount] = React.useState(0);
  const [mountMs, setMountMs] = React.useState<number | null>(null);
  const fps = useFpsCounter();

  const mountKey = `${variant}-${count}-${remount}`;

  React.useEffect(() => {
    setMountMs(null);
  }, [mountKey]);

  const onMounted = React.useCallback((ms: number) => setMountMs(ms), []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.metric}>
          {`JS mount: ${mountMs == null ? '…' : `${mountMs.toFixed(0)} ms`}   |   JS FPS: ${fps}`}
        </Text>
        <Text style={styles.note}>
          expo-ui Compose rendering continues after JS commit. For UI-thread FPS and memory, profile
          with Android Studio Profiler on a physical device.
        </Text>
        <View style={styles.row}>
          <SegButton
            label="expo-ui"
            active={variant === 'expo-ui'}
            onPress={() => setVariant('expo-ui')}
          />
          <SegButton label="RN" active={variant === 'rn'} onPress={() => setVariant('rn')} />
        </View>
        <View style={styles.row}>
          {ITEM_COUNTS.map((n) => (
            <SegButton
              key={n}
              label={String(n)}
              active={count === n}
              onPress={() => setCount(n)}
            />
          ))}
          <Pressable style={styles.remountBtn} onPress={() => setRemount((r) => r + 1)}>
            <Text style={styles.remountBtnText}>Remount</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.content} key={mountKey}>
        {variant === 'expo-ui' ? (
          <ExpoUIContent count={count} onMounted={onMounted} />
        ) : (
          <RNContent count={count} onMounted={onMounted} />
        )}
      </View>
    </View>
  );
}

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segBtn, active && styles.segBtnActive] as ViewStyle[]}>
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    padding: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
    backgroundColor: '#F6F6F6',
  },
  content: { flex: 1 },
  metric: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  note: { fontSize: 11, color: '#666' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#999',
    backgroundColor: '#FFF',
  },
  segBtnActive: { backgroundColor: '#4096FF', borderColor: '#4096FF' },
  segBtnText: { fontSize: 13, color: '#333' },
  segBtnTextActive: { color: '#FFF' },
  remountBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  remountBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  rnContainer: { gap: 8, paddingVertical: 4 },
  rnItem: {
    height: 60,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rnItemText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});

BenchmarkScrollScreen.navigationOptions = {
  title: 'Benchmark: ScrollView',
};
