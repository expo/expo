import { Column, Host, RNHostView } from '@expo/ui';
import React from 'react';
import { Text, View } from 'react-native';

import type { JasmineInterface, TestPortal } from '../types';
import { mountAndWaitForWithTimeout } from './helpers';

export const name = 'ExpoUI RNHostView size';
export const route = 'expo-ui-rnhostview-size';

const SETTLE_MS = 250;
const TIMEOUT_MS = 10000;
const TOLERANCE = 1;

const PARENT_WIDTH = 300;
const BOX_WIDTH = 40;
const BOX_HEIGHT = 20;
// The fill box goes on the Host, whose `style` is a real React Native style and so a real Yoga box.
// A Column's width and height become native modifiers, which Yoga cannot see.
const HOST_WIDTH = 200;
const HOST_HEIGHT = 120;
const COLUMN_PADDING = 8;
const TEXT = 'Hello, world!';
const FONT_SIZE = 24;

type Axes = { width: number; height: number };
type Paired = { hosted: Axes; control: Axes };

function useSettledLayout(onSettled: (size: Axes) => void) {
  const size = React.useRef<Axes | undefined>(undefined);
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSettledRef = React.useRef(onSettled);

  React.useEffect(() => {
    onSettledRef.current = onSettled;
  });

  React.useEffect(() => () => clearTimeout(settle.current), []);

  return React.useCallback((event: { nativeEvent: { layout: Axes } }) => {
    const { width, height } = event.nativeEvent.layout;
    size.current = { width, height };

    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (size.current) {
        onSettledRef.current(size.current);
      }
    }, SETTLE_MS);
  }, []);
}

function HuggingProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host matchContents>
        <Column>
          <RNHostView matchContents onLayout={({ nativeEvent }) => onMeasured(nativeEvent.layout)}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, height: BOX_HEIGHT }} />
              <View style={{ width: BOX_WIDTH, height: BOX_HEIGHT }} />
            </View>
          </RNHostView>
        </Column>
      </Host>
    </View>
  );
}

function FillingProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  const onLayout = useSettledLayout(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host style={{ width: HOST_WIDTH, height: HOST_HEIGHT }}>
        <RNHostView onLayout={onLayout}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, height: BOX_HEIGHT }} />
            <View style={{ width: BOX_WIDTH, height: BOX_HEIGHT }} />
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

function CrossAxisProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host style={{ height: HOST_HEIGHT }}>
        <RNHostView matchContents onLayout={({ nativeEvent }) => onMeasured(nativeEvent.layout)}>
          <View style={{ width: BOX_WIDTH, height: BOX_HEIGHT }} />
        </RNHostView>
      </Host>
    </View>
  );
}

// This case is simpler example of what causes loops
// https://github.com/expo/expo/pull/48059#issuecomment-5351404485
function PaddedHostProbe({ onMeasured }: { onMeasured: (sizes: Paired) => void }) {
  const sizes = React.useRef<Partial<Paired>>({});

  const report = (key: keyof Paired, layout: Axes) => {
    sizes.current[key] = { width: layout.width, height: layout.height };

    const { hosted, control } = sizes.current;
    if (hosted && control) {
      onMeasured({ hosted, control });
    }
  };

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host matchContents>
        <Column style={{ padding: COLUMN_PADDING }}>
          <RNHostView
            matchContents
            onLayout={({ nativeEvent }) => report('hosted', nativeEvent.layout)}>
            <Text style={{ fontSize: FONT_SIZE }}>{TEXT}</Text>
          </RNHostView>
        </Column>
      </Host>
      <View
        style={{ alignSelf: 'flex-start' }}
        onLayout={({ nativeEvent }) => report('control', nativeEvent.layout)}>
        <Text style={{ fontSize: FONT_SIZE }}>{TEXT}</Text>
      </View>
    </View>
  );
}

export async function test(
  { it, describe, expect, afterEach }: JasmineInterface,
  { setPortalChild, cleanupPortal }: TestPortal
) {
  describe(name, () => {
    afterEach(async () => {
      await cleanupPortal();
    });

    it('lays out hosted content at its own size, not at the width the parent offers', async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <HuggingProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - BOX_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(size.height - BOX_HEIGHT)).toBeLessThan(TOLERANCE);
    });

    it('spreads hosted content across its native parent without matchContents', async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <FillingProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - HOST_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(size.height - HOST_HEIGHT)).toBeLessThan(TOLERANCE);
    });

    it('hugs fixed-size content on the cross axis instead of filling the host', async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <CrossAxisProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - BOX_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(size.height - BOX_HEIGHT)).toBeLessThan(TOLERANCE);
    });

    it('hugs hosted text inside a natively padded host', async () => {
      const { hosted, control } = await mountAndWaitForWithTimeout<Paired>(
        <PaddedHostProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(control.width).toBeGreaterThan(0);
      expect(Math.abs(hosted.width - control.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(hosted.height - control.height)).toBeLessThan(TOLERANCE);
      expect(hosted.width).toBeLessThan(PARENT_WIDTH);
    });
  });
}
