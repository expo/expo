import { Column, Host, Row } from '@expo/ui';
import React from 'react';
import { View } from 'react-native';

import type { JasmineInterface, TestPortal } from '../types';
import { mountAndWaitForWithTimeout } from './helpers';

export const name = 'ExpoUI Universal size';
export const route = 'expo-ui-universal-size';

// `onLayout` is the Host frame from `style`. `onLayoutContent` is the native content size.
// The wrapper is wider than the Host, so a percentage is of the Host and not of that wrapper.
const SETTLE_MS = 250;
const TIMEOUT_MS = 10000;
// Anything under a point is rounding between the two measurement systems.
const TOLERANCE = 1;

const PARENT_WIDTH = 300;
const HOST_WIDTH = 200;
const HOST_HEIGHT = 100;

type Axes = { width: number; height: number };
type Measured = { laid: Axes; content: Axes };

/** Reports both sizes once layout has been quiet for `SETTLE_MS`. */
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

  return { onLayout, onLayoutContent };
}

function SizeProbe({
  children,
  onMeasured,
}: {
  children: React.ReactNode;
  onMeasured: (measured: Measured) => void;
}) {
  const { onLayout, onLayoutContent } = useSettledSize(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host
        style={{ width: HOST_WIDTH, height: HOST_HEIGHT }}
        onLayout={onLayout}
        onLayoutContent={onLayoutContent}>
        {children}
      </Host>
    </View>
  );
}

export async function test(
  { it, describe, expect, afterEach }: JasmineInterface,
  { setPortalChild, cleanupPortal }: TestPortal
) {
  const expectNear = (actual: number, expected: number) => {
    expect(Math.abs(actual - expected)).toBeLessThan(TOLERANCE);
  };

  const measure = (children: React.ReactNode) =>
    mountAndWaitForWithTimeout<Measured>(
      <SizeProbe onMeasured={() => {}}>{children}</SizeProbe>,
      'onMeasured',
      setPortalChild,
      TIMEOUT_MS
    );

  describe(name, () => {
    afterEach(async () => {
      await cleanupPortal();
    });

    it('lays a 100% column out at the host size', async () => {
      const measured = await measure(<Column style={{ width: '100%', height: '100%' }} />);

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, HOST_WIDTH);
      expectNear(measured.content.height, HOST_HEIGHT);
    });

    it('lays a column out at half the host width', async () => {
      const measured = await measure(<Column style={{ width: '50%', height: '100%' }} />);

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, HOST_WIDTH / 2);
      expectNear(measured.content.height, HOST_HEIGHT);
    });

    it('lays a column out at a fraction of the host height', async () => {
      const measured = await measure(<Column style={{ width: '100%', height: '40%' }} />);

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, HOST_WIDTH);
      expectNear(measured.content.height, HOST_HEIGHT * 0.4);
    });

    it('lays a fixed-size column out in points inside a larger host', async () => {
      const measured = await measure(<Column style={{ width: 80, height: 36 }} />);

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, 80);
      expectNear(measured.content.height, 36);
    });

    it('lays a 0% wide column out with no width', async () => {
      // The child has its own width. If `0%` were ignored, the content would be at least this wide.
      const measured = await measure(
        <Column style={{ width: '0%', height: '100%' }}>
          <Column style={{ width: 40, height: 20 }} />
        </Column>
      );

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, 0);
      expectNear(measured.content.height, HOST_HEIGHT);
    });

    it('lays a row out at a fraction of the host width', async () => {
      const measured = await measure(<Row spacing={0} style={{ width: '60%', height: '100%' }} />);

      expectNear(measured.laid.width, HOST_WIDTH);
      expectNear(measured.laid.height, HOST_HEIGHT);
      expectNear(measured.content.width, HOST_WIDTH * 0.6);
      expectNear(measured.content.height, HOST_HEIGHT);
    });
  });
}
