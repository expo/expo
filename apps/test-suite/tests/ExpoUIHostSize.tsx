import { Column, Host, Text as UIText } from '@expo/ui';
import React from 'react';
import { View } from 'react-native';

import type { JasmineInterface, TestPortal } from '../types';
import { mountAndWaitForWithTimeout } from './helpers';

export const name = 'ExpoUI Host size';
export const route = 'expo-ui-host-size';

// Tests Host matchContents behavior on iOS and Android. Uses onLayoutContent and onLayout callback to
// assert that the Host's size matches its content size when matchContents is true
const SETTLE_MS = 250;
const TIMEOUT_MS = 10000;
// Anything under a point is rounding between the two measurement systems.
const TOLERANCE = 1;
const TINTS = ['#ff0000', '#0000ff'];

type Axes = { width: number; height: number };
type Measured = { laid: Axes; content: Axes };
type AcrossRerender = { before: Measured; after: Measured };

/** Stable handlers, so re-rendering a probe leaves the Host's props unchanged. */
function useSettledSize(onSettled: (measured: Measured) => void) {
  const sizes = React.useRef<{ laid?: Axes; content?: Axes }>({});
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSettledRef = React.useRef(onSettled);

  React.useEffect(() => {
    onSettledRef.current = onSettled;
  });

  React.useEffect(() => () => clearTimeout(settle.current), []);

  const scheduleReport = React.useCallback(() => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const { laid, content } = sizes.current;
      if (laid && content) {
        onSettledRef.current({ laid, content });
      }
    }, SETTLE_MS);
  }, []);

  const onLayout = React.useCallback(
    (event: { nativeEvent: { layout: Axes } }) => {
      const { width, height } = event.nativeEvent.layout;
      sizes.current.laid = { width, height };
      scheduleReport();
    },
    [scheduleReport]
  );

  const onLayoutContent = React.useCallback(
    (event: { nativeEvent: Axes }) => {
      const { width, height } = event.nativeEvent;
      sizes.current.content = { width, height };
      scheduleReport();
    },
    [scheduleReport]
  );

  return { onLayout, onLayoutContent, scheduleReport };
}

/** Reports both sizes once layout has been quiet for `SETTLE_MS`. */
function HostSizeProbe({
  matchContents,
  onMeasured,
}: {
  matchContents: boolean | { vertical?: boolean; horizontal?: boolean };
  onMeasured: (measured: Measured) => void;
}) {
  const { onLayout, onLayoutContent } = useSettledSize(onMeasured);

  return (
    <View style={{ width: 300 }}>
      <Host matchContents={matchContents} onLayout={onLayout} onLayoutContent={onLayoutContent}>
        <Column spacing={4}>
          <UIText>First line</UIText>
          <UIText>Second line</UIText>
        </Column>
      </Host>
    </View>
  );
}

/**
 * Recoloring re-renders the Host's children without touching its props, the case where the yoga
 * node used to keep its old sizeless style. The content size doesn't change, so nothing repairs it.
 */
function HostRerenderProbe({ onMeasured }: { onMeasured: (measured: AcrossRerender) => void }) {
  const [tint, setTint] = React.useState(0);
  const before = React.useRef<Measured | undefined>(undefined);

  const { onLayout, onLayoutContent, scheduleReport } = useSettledSize((measured) => {
    if (!before.current) {
      before.current = measured;
      setTint(1);
    } else if (tint > 0) {
      onMeasured({ before: before.current, after: measured });
    }
  });

  // No layout event fires when the size is right, so report on a timer.
  React.useEffect(() => {
    if (tint > 0) {
      scheduleReport();
    }
  }, [tint, scheduleReport]);

  return (
    <View style={{ width: 300 }}>
      <Host matchContents onLayout={onLayout} onLayoutContent={onLayoutContent}>
        <Column spacing={4}>
          <UIText textStyle={{ color: TINTS[tint] }}>First line</UIText>
          <UIText textStyle={{ color: TINTS[tint] }}>Second line</UIText>
        </Column>
      </Host>
    </View>
  );
}

export async function test(
  { it, describe, expect, afterEach }: JasmineInterface,
  { setPortalChild, cleanupPortal }: TestPortal
) {
  const measure = (matchContents: boolean | { vertical?: boolean; horizontal?: boolean }) =>
    mountAndWaitForWithTimeout<Measured>(
      <HostSizeProbe matchContents={matchContents} onMeasured={() => {}} />,
      'onMeasured',
      setPortalChild,
      TIMEOUT_MS
    );

  describe(name, () => {
    afterEach(async () => {
      await cleanupPortal();
    });

    it('lays out a matchContents Host at its content size on both axes', async () => {
      const { laid, content } = await measure(true);

      expect(content.width).toBeGreaterThan(0);
      expect(content.height).toBeGreaterThan(0);
      expect(Math.abs(laid.width - content.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(laid.height - content.height)).toBeLessThan(TOLERANCE);
    });

    it('lays out a horizontal matchContents Host at its content width', async () => {
      const { laid, content } = await measure({ horizontal: true });

      expect(content.width).toBeGreaterThan(0);
      expect(Math.abs(laid.width - content.width)).toBeLessThan(TOLERANCE);
    });

    it('lays out a vertical matchContents Host at its content height', async () => {
      const { laid, content } = await measure({ vertical: true });

      expect(content.height).toBeGreaterThan(0);
      expect(Math.abs(laid.height - content.height)).toBeLessThan(TOLERANCE);
    });

    it('keeps a matchContents Host at its content size after its children re-render', async () => {
      const { before, after } = await mountAndWaitForWithTimeout<AcrossRerender>(
        <HostRerenderProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(after.content.width - before.content.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(after.content.height - before.content.height)).toBeLessThan(TOLERANCE);

      expect(Math.abs(after.laid.width - after.content.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(after.laid.height - after.content.height)).toBeLessThan(TOLERANCE);
    });
  });
}
