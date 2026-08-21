import { Column, Host, Text as UIText } from '@expo/ui';
import React from 'react';
import { View } from 'react-native';

import { mountAndWaitForWithTimeout } from './helpers';

export const name = 'ExpoUI Host size';
export const route = 'expo-ui-host-size';

/**
 * A `matchContents` Host reports the size its native content measured, and that size has to reach
 * the Yoga node for the host to be laid out at it. So on every matched axis these must agree:
 *
 *   content - what SwiftUI or Compose measured, from `onLayoutContent`
 *   laid    - what Yoga laid the host out at, from `onLayout`
 *
 * This is the invariant that https://github.com/expo/expo/pull/48059 broke. Note that reproducing
 * that particular regression needs shadow tree commit contention, which this test does not create.
 */

const SETTLE_MS = 250;
const TIMEOUT_MS = 10000;
// Anything under a point is rounding between the two measurement systems.
const TOLERANCE = 1;

type Axes = { width: number; height: number };
type Measured = { laid: Axes; content: Axes };

/** Reports both sizes once layout has been quiet for `SETTLE_MS`. */
function HostSizeProbe({
  matchContents,
  onMeasured,
}: {
  matchContents: boolean | { vertical?: boolean; horizontal?: boolean };
  onMeasured: (measured: Measured) => void;
}) {
  const sizes = React.useRef<{ laid?: Axes; content?: Axes }>({});
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleReport = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const { laid, content } = sizes.current;
      if (laid && content) {
        onMeasured({ laid, content });
      }
    }, SETTLE_MS);
  };

  React.useEffect(() => () => clearTimeout(settle.current), []);

  return (
    <View style={{ width: 300 }}>
      <Host
        matchContents={matchContents}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          sizes.current.laid = { width, height };
          scheduleReport();
        }}
        onLayoutContent={(event) => {
          const { width, height } = event.nativeEvent;
          sizes.current.content = { width, height };
          scheduleReport();
        }}>
        <Column spacing={4}>
          <UIText>First line</UIText>
          <UIText>Second line</UIText>
        </Column>
      </Host>
    </View>
  );
}

export async function test(
  { it, describe, expect, afterEach }: any,
  { setPortalChild, cleanupPortal }: any
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
  });
}
