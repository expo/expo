import { installOnUIRuntime } from 'expo-modules-core';
import { Observe } from 'expo-observe';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { getUIRuntimeHolder } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

const TRAVEL = 220;
const CYCLE_MS = 700;

// Expo modules are not on the worklet runtime until they are installed there, so
// `globalThis.expo.modules` is empty in a worklet without this. Runs once per app start.
let installState: string;
try {
  installOnUIRuntime(getUIRuntimeHolder());
  installState = 'Expo modules installed on the UI runtime';
} catch (error) {
  installState = `installOnUIRuntime failed: ${String(error)}`;
}

/**
 * The three ways a worklet can reach `logEvent`, from most to least direct:
 * `proxy` captures the `expo-observe` JS proxy, `native` calls the module
 * installed on the worklet runtime, and `runOnJS` hops back to the JS thread.
 */
type Strategy = 'proxy' | 'native' | 'runOnJS';

const STRATEGIES: { strategy: Strategy; title: string; description: string }[] = [
  {
    strategy: 'proxy',
    title: 'From worklet — Observe.logEvent',
    description: 'Captures the expo-observe proxy in the animation callback',
  },
  {
    strategy: 'native',
    title: 'From worklet — native module',
    description: 'Calls globalThis.expo.modules.ExpoAppMetrics.logEvent',
  },
  {
    strategy: 'runOnJS',
    title: 'From worklet — runOnJS hop',
    description: 'Control: schedules the call back onto the JS thread',
  },
];

export function WorkletAnimationSection() {
  const theme = useTheme();
  const [running, setRunning] = useState<Strategy | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [cycles, setCycles] = useState(0);

  const offset = useSharedValue(0);

  const report = (message: string) => setStatus(message);
  const countCycle = () => setCycles((count) => count + 1);

  const logFromJS = (cycle: number) => {
    Observe.logEvent('debug.worklet_animation_cycle', {
      severity: 'info',
      body: 'Animation cycle finished, logged after hopping to the JS thread',
      attributes: { strategy: 'runOnJS', cycle },
    });
  };

  const onProxyCycle = (finished?: boolean) => {
    'worklet';
    if (!finished) return;
    try {
      Observe.logEvent('debug.worklet_animation_cycle', {
        severity: 'info',
        body: 'Animation cycle finished, logged from the UI runtime via the proxy',
        attributes: { strategy: 'proxy' },
      });
      runOnJS(countCycle)();
      runOnJS(report)('proxy: logEvent returned without throwing');
    } catch (error) {
      runOnJS(report)(`proxy: ${String(error)}`);
    }
  };

  const onNativeCycle = (finished?: boolean) => {
    'worklet';
    if (!finished) return;
    try {
      const appMetrics = (globalThis as any).expo?.modules?.ExpoAppMetrics;
      if (!appMetrics) {
        runOnJS(report)('native: ExpoAppMetrics is not installed on the worklet runtime');
        return;
      }
      appMetrics.logEvent('debug.worklet_animation_cycle', {
        severity: 'info',
        body: 'Animation cycle finished, logged from the UI runtime via the native module',
        attributes: { strategy: 'native' },
      });
      runOnJS(countCycle)();
      runOnJS(report)('native: logEvent returned without throwing');
    } catch (error) {
      runOnJS(report)(`native: ${String(error)}`);
    }
  };

  const onRunOnJSCycle = (finished?: boolean) => {
    'worklet';
    if (!finished) return;
    try {
      runOnJS(countCycle)();
      runOnJS(logFromJS)(0);
      runOnJS(report)('runOnJS: scheduled the call on the JS thread');
    } catch (error) {
      runOnJS(report)(`runOnJS: ${String(error)}`);
    }
  };

  const start = (strategy: Strategy) => {
    const callback =
      strategy === 'proxy' ? onProxyCycle : strategy === 'native' ? onNativeCycle : onRunOnJSCycle;

    setRunning(strategy);
    setStatus('running…');
    setCycles(0);
    cancelAnimation(offset);
    offset.value = 0;
    // A worklet failure can surface when the animation is built rather than when the
    // callback runs, so keep the caller side guarded too.
    try {
      offset.value = withRepeat(withTiming(TRAVEL, { duration: CYCLE_MS }, callback), -1, true);
    } catch (error) {
      setStatus(`start: ${String(error)}`);
    }
  };

  const inspectRuntime = () => {
    try {
      runOnUI(() => {
        'worklet';
        const expo = (globalThis as any).expo;
        if (!expo) {
          runOnJS(report)('globalThis.expo is missing on the UI runtime');
          return;
        }
        const modules = expo.modules;
        if (!modules) {
          runOnJS(report)('globalThis.expo exists but has no `modules`');
          return;
        }
        const appMetrics = modules.ExpoAppMetrics;
        runOnJS(report)(
          [
            `typeof expo.modules: ${typeof modules}`,
            `typeof ExpoAppMetrics: ${typeof appMetrics}`,
            `typeof ExpoAppMetrics.logEvent: ${appMetrics ? typeof appMetrics.logEvent : 'n/a'}`,
            `typeof ExpoObserve: ${typeof modules.ExpoObserve}`,
          ].join('\n')
        );
      })();
    } catch (error) {
      setStatus(`inspect: ${String(error)}`);
    }
  };

  const enumerateRuntime = () => {
    try {
      runOnUI(() => {
        'worklet';
        const modules = (globalThis as any).expo?.modules;
        if (!modules) {
          runOnJS(report)('no expo.modules on the UI runtime');
          return;
        }
        runOnJS(report)(`module names: ${Object.keys(modules).join(', ') || '(none)'}`);
      })();
    } catch (error) {
      setStatus(`enumerate: ${String(error)}`);
    }
  };

  // Enumerating a module object on the worklet runtime takes the process down, so this
  // probe is kept separate from the `typeof` checks above.
  const enumerateModule = () => {
    try {
      runOnUI(() => {
        'worklet';
        const appMetrics = (globalThis as any).expo?.modules?.ExpoAppMetrics;
        if (!appMetrics) {
          runOnJS(report)('no ExpoAppMetrics on the UI runtime');
          return;
        }
        runOnJS(report)(
          `ExpoAppMetrics members: ${Object.keys(appMetrics).join(', ') || '(none)'}`
        );
      })();
    } catch (error) {
      setStatus(`enumerate module: ${String(error)}`);
    }
  };

  const stop = () => {
    cancelAnimation(offset);
    offset.value = withTiming(0, { duration: 200 });
    setRunning(null);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Worklet animation</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Runs a Reanimated animation on the UI thread and calls `logEvent` from the worklet that
        fires at the end of every cycle. Each strategy reaches the module a different way.
      </Text>
      <Text style={[styles.status, { color: theme.text.secondary }]}>{installState}</Text>
      <View style={[styles.track, { backgroundColor: theme.background.element }]}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </View>
      <Text style={[styles.status, { color: theme.text.secondary }]}>
        {running ? `${running} · ${cycles} cycles logged` : 'idle'}
      </Text>
      {status ? <Text style={[styles.status, { color: theme.text.default }]}>{status}</Text> : null}
      {STRATEGIES.map(({ strategy, title, description }) => (
        <Button
          key={strategy}
          title={title}
          description={description}
          onPress={() => start(strategy)}
          theme="secondary"
        />
      ))}
      <Button
        title="Inspect worklet runtime"
        description="Reports what the UI runtime can see, without enumerating"
        onPress={inspectRuntime}
        theme="secondary"
      />
      <Button
        title="Enumerate worklet modules"
        description="Object.keys on expo.modules"
        onPress={enumerateRuntime}
        theme="secondary"
      />
      <Button
        title="Enumerate ExpoAppMetrics"
        description="Object.keys on the module itself — crashes the app"
        onPress={enumerateModule}
        theme="secondary"
      />
      <Button title="Stop animation" onPress={stop} theme="secondary" disabled={!running} />
    </>
  );
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
  track: {
    height: 64,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  box: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#4630eb',
  },
  status: {
    fontSize: 13,
    marginBottom: 8,
  },
});
