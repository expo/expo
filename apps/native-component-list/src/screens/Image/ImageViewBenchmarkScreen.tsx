import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Directory, File, Paths } from 'expo-file-system';
import { Image, type ImageContentFit } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

// Benchmarks the current iOS image view against the new one. A runner opens it with a deep link, for example
// `bareexpo://components/image/benchmark?scenario=grid&view=v2&run=1`, and reads the result from
// `Documents/bench/<scenario>-<view>-<run>.json`. The images come from a local server (`server` param). 3 s after
// the result, the screen clears the memory cache and writes `<scenario>-<view>-<run>.cleared`.

type Params = { scenario?: string; view?: string; run?: string; server?: string };

type Result = Record<string, number | string>;

const MEDIUM_COUNT = 200;
const LARGE_COUNT = 20;

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}

async function writeResult(name: string, result: Result) {
  const directory = new Directory(Paths.document, 'bench');
  directory.create({ intermediates: true, idempotent: true });
  await new File(directory, `${name}.json`).write(JSON.stringify(result));
  console.log(`[bench] done ${name} ${JSON.stringify(result)}`);
}

/**
 * Counts the frames of the UI thread and the frames that took longer than 25 ms (1.5 frames at 60 Hz).
 */
function useUIFrameStats() {
  const frames = useSharedValue(0);
  const hitches = useSharedValue(0);
  const hitchTime = useSharedValue(0);
  const callback = useFrameCallback((frame) => {
    'worklet';
    const delta = frame.timeSincePreviousFrame ?? 0;
    frames.value += 1;
    if (delta > 25) {
      hitches.value += 1;
      hitchTime.value += delta - 16.67;
    }
  }, false);

  // The functions read the frame callback through a ref, so they stay the same across renders.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useMemo(
    () => ({
      start() {
        frames.value = 0;
        hitches.value = 0;
        hitchTime.value = 0;
        callbackRef.current.setActive(true);
      },
      stop() {
        callbackRef.current.setActive(false);
        return {
          uiFrames: frames.value,
          uiHitches: hitches.value,
          uiHitchTimeMs: Math.round(hitchTime.value),
        };
      },
    }),
    // The shared values are the same objects across renders.
    []
  );
}

type GridProps = {
  uris: string[];
  size: number;
  useV2: boolean;
  contentFit?: ImageContentFit;
  onLoadStart?: () => void;
  onDisplay: (index: number, time: number) => void;
  onError?: () => void;
};

function Grid({ uris, size, useV2, contentFit, onLoadStart, onDisplay, onError }: GridProps) {
  return (
    <View style={styles.grid}>
      {uris.map((uri, index) => (
        <Image
          key={uri}
          experimental_useV2View={useV2}
          source={{ uri }}
          contentFit={contentFit}
          style={{ width: size, height: size }}
          onLoadStart={onLoadStart}
          onDisplay={() => onDisplay(index, performance.now())}
          onError={onError}
        />
      ))}
    </View>
  );
}

/**
 * Renders the images at once and measures the time until each of them is displayed. With `warm`, it first renders
 * them once, so the second pass reads them from the disk cache.
 */
function GridScenario({
  uris,
  size,
  useV2,
  warm,
  onDone,
}: {
  uris: string[];
  size: number;
  useV2: boolean;
  warm: boolean;
  onDone: (result: Result) => void;
}) {
  const [pass, setPass] = useState<'prime' | 'clear' | 'measure'>(warm ? 'prime' : 'measure');
  const startTime = useRef(performance.now());
  const displayTimes = useRef(new Map<number, number>());
  const loadStarts = useRef(0);
  const errors = useRef(0);
  const finished = useRef(false);

  const onDisplay = useCallback(
    (index: number, time: number) => {
      if (displayTimes.current.has(index)) {
        return;
      }
      displayTimes.current.set(index, time - startTime.current);

      if (displayTimes.current.size + errors.current < uris.length) {
        return;
      }
      if (pass === 'prime') {
        setPass('clear');
        return;
      }
      if (!finished.current) {
        finished.current = true;
        const times = [...displayTimes.current.values()];
        onDone({
          images: uris.length,
          allDisplayedMs: Math.round(Math.max(...times)),
          p50Ms: Math.round(percentile(times, 0.5)),
          p90Ms: Math.round(percentile(times, 0.9)),
          loadStarts: loadStarts.current,
          errors: errors.current,
        });
      }
    },
    [pass, uris.length, onDone]
  );

  useEffect(() => {
    if (pass !== 'clear') {
      return;
    }
    Image.clearMemoryCache().then(() => {
      displayTimes.current.clear();
      loadStarts.current = 0;
      errors.current = 0;
      startTime.current = performance.now();
      setPass('measure');
    });
  }, [pass]);

  if (pass === 'clear') {
    return null;
  }
  return (
    <Grid
      key={pass}
      uris={uris}
      size={size}
      useV2={useV2}
      onLoadStart={() => (loadStarts.current += 1)}
      onDisplay={onDisplay}
      onError={() => (errors.current += 1)}
    />
  );
}

/**
 * Displays the images, then switches `contentFit` between `cover` and `contain` 20 times, every 100 ms.
 */
function ChurnScenario({
  uris,
  useV2,
  onDone,
}: {
  uris: string[];
  useV2: boolean;
  onDone: (result: Result) => void;
}) {
  const [contentFit, setContentFit] = useState<ImageContentFit>('cover');
  const displayed = useRef(new Set<number>());
  const loadStarts = useRef(0);
  const displays = useRef(0);
  const churning = useRef(false);
  const frameStats = useUIFrameStats();

  const onDisplay = useCallback(
    (index: number) => {
      displayed.current.add(index);
      if (churning.current) {
        displays.current += 1;
      }
      if (displayed.current.size === uris.length && !churning.current) {
        churning.current = true;
        loadStarts.current = 0;
        frameStats.start();
        const startTime = performance.now();
        let toggles = 0;
        const timer = setInterval(() => {
          toggles += 1;
          setContentFit(toggles % 2 === 1 ? 'contain' : 'cover');
          if (toggles === 20) {
            clearInterval(timer);
            // Waits for the reloads that the last toggles started.
            setTimeout(() => {
              onDone({
                images: uris.length,
                toggles,
                loadStartsDuringChurn: loadStarts.current,
                displaysDuringChurn: displays.current,
                churnMs: Math.round(performance.now() - startTime),
                ...frameStats.stop(),
              });
            }, 3000);
          }
        }, 100);
      }
    },
    [uris.length, onDone, frameStats]
  );

  return (
    <Grid
      uris={uris}
      size={56}
      useV2={useV2}
      contentFit={contentFit}
      onLoadStart={() => (loadStarts.current += 1)}
      onDisplay={onDisplay}
    />
  );
}

/**
 * Scrolls a long list of distinct images at a constant speed and counts the frames that took too long.
 */
function ListScenario({
  server,
  useV2,
  speed,
  onDone,
}: {
  server: string;
  useV2: boolean;
  /** Points per second. */
  speed: number;
  onDone: (result: Result) => void;
}) {
  const listRef = useRef<FlashListRef<number>>(null);
  const cellSize = Math.floor(Dimensions.get('window').width / 3);
  const rows = useMemo(() => Array.from({ length: 600 }, (_, index) => index), []);
  const displays = useRef(0);
  const loadStarts = useRef(0);
  const frameStats = useUIFrameStats();

  useEffect(() => {
    let frame = 0;
    let jsFrames = 0;
    let jsHitches = 0;
    let offset = 0;
    let previous = 0;
    const duration = 8000;
    const timeout = setTimeout(() => {
      frameStats.start();
      const startTime = performance.now();
      previous = startTime;
      const tick = (time: number) => {
        const delta = time - previous;
        previous = time;
        jsFrames += 1;
        if (delta > 25) {
          jsHitches += 1;
        }
        offset += (speed * delta) / 1000;
        listRef.current?.scrollToOffset({ offset, animated: false });

        if (time - startTime < duration) {
          frame = requestAnimationFrame(tick);
          return;
        }
        onDone({
          scrolledPoints: Math.round(offset),
          displays: displays.current,
          loadStarts: loadStarts.current,
          jsFrames,
          jsHitches,
          ...frameStats.stop(),
        });
      };
      frame = requestAnimationFrame(tick);
    }, 1000);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [onDone, frameStats, speed]);

  return (
    <FlashList
      ref={listRef}
      data={rows}
      keyExtractor={(row) => String(row)}
      renderItem={({ item: row }) => (
        <View style={styles.row}>
          {[0, 1, 2].map((column) => {
            const cell = row * 3 + column;
            const uri = `${server}/img/medium-${cell % MEDIUM_COUNT}.jpg?cell=${cell}`;
            return (
              <Image
                key={column}
                experimental_useV2View={useV2}
                source={{ uri }}
                recyclingKey={uri}
                style={{ width: cellSize, height: cellSize }}
                onLoadStart={() => (loadStarts.current += 1)}
                onDisplay={() => (displays.current += 1)}
              />
            );
          })}
        </View>
      )}
    />
  );
}

export default function ImageViewBenchmarkScreen({ route }: { route?: { params?: Params } }) {
  const params = route?.params ?? {};
  const scenario = params.scenario ?? 'grid';
  const view = params.view === 'v2' ? 'v2' : 'current';
  const run = params.run ?? '0';
  const server = params.server ?? 'http://localhost:8099';
  const useV2 = view === 'v2';
  const name = `${scenario}-${view}-${run}`;
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Preparing');

  useEffect(() => {
    // Every run starts with empty caches.
    Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]).then(() => {
      setStatus('Running');
      setReady(true);
    });
  }, []);

  const onDone = useCallback(
    async (result: Result) => {
      setStatus('Done');
      await writeResult(name, { scenario, view, run, ...result });
      // The runner measures the memory once more after this, to tell the memory cache apart from other memory.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await Image.clearMemoryCache();
      await new File(new Directory(Paths.document, 'bench'), `${name}.cleared`).write('');
      setStatus('Memory cache cleared');
    },
    [name, scenario, view, run]
  );

  const mediumUris = (count: number, offset = 0) =>
    Array.from(
      { length: count },
      (_, index) => `${server}/img/medium-${(index + offset) % MEDIUM_COUNT}.jpg`
    );
  const largeUris = (count: number) =>
    Array.from({ length: count }, (_, index) => `${server}/img/large-${index % LARGE_COUNT}.jpg`);

  let content = null;
  if (ready) {
    switch (scenario) {
      case 'grid':
        content = (
          <GridScenario
            uris={mediumUris(60)}
            size={56}
            useV2={useV2}
            warm={false}
            onDone={onDone}
          />
        );
        break;
      case 'grid-warm':
        content = (
          <GridScenario uris={mediumUris(60)} size={56} useV2={useV2} warm onDone={onDone} />
        );
        break;
      case 'large':
        content = (
          <GridScenario
            uris={largeUris(10)}
            size={100}
            useV2={useV2}
            warm={false}
            onDone={onDone}
          />
        );
        break;
      case 'churn':
        content = <ChurnScenario uris={mediumUris(30)} useV2={useV2} onDone={onDone} />;
        break;
      case 'list':
        content = <ListScenario server={server} useV2={useV2} speed={1500} onDone={onDone} />;
        break;
      case 'list-fast':
        content = <ListScenario server={server} useV2={useV2} speed={4000} onDone={onDone} />;
        break;
      case 'stress':
        content = (
          <GridScenario
            uris={[...mediumUris(MEDIUM_COUNT), ...largeUris(LARGE_COUNT)]}
            size={24}
            useV2={useV2}
            warm={false}
            onDone={onDone}
          />
        );
        break;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status} testID="benchmark-status">
        {name}: {status}
      </Text>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  status: {
    padding: 8,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
  },
});
