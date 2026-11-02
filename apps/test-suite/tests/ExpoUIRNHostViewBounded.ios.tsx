import { MenuView } from '@expo/ui/community/menu';
import { Host, RNHostView } from '@expo/ui/swift-ui';
import React from 'react';
import { Text, View } from 'react-native';

import type { JasmineInterface, TestPortal } from '../types';
import { mountAndWaitForWithTimeout } from './helpers';

export const name = 'ExpoUI RNHostView boundedByHost';
export const route = 'expo-ui-rnhostview-bounded';

const SETTLE_MS = 250;
const TIMEOUT_MS = 10000;
const TOLERANCE = 1;

const PARENT_WIDTH = 300;
const NARROW_WIDTH = 200;
const BOX_WIDTH = 40;
const BOX_HEIGHT = 20;
const TEXT = 'Edit';
const LONG_TEXT = 'a much longer string that has to wrap when the width is limited';
const FONT_SIZE = 24;

type Axes = { width: number; height: number };
type AcrossChange = { before: Axes; changed: Axes; restored: Axes };

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

// Steps through a change and back, reporting the settled size at each step.
function useAcrossChange(onMeasured: (sizes: AcrossChange) => void) {
  const [step, setStep] = React.useState(0);
  const seen = React.useRef<Partial<AcrossChange>>({});

  const onLayout = useSettledLayout((size) => {
    if (step === 0) {
      seen.current.before = size;
      setStep(1);
    } else if (step === 1) {
      seen.current.changed = size;
      setStep(2);
    } else if (step === 2) {
      const { before, changed } = seen.current;
      if (before && changed) {
        onMeasured({ before, changed, restored: size });
      }
    }
  });

  return { changed: step === 1, onLayout };
}

function FillingProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  const onLayout = useSettledLayout(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host>
        <RNHostView matchContents boundedByHost>
          <View style={{ width: '100%' }} onLayout={onLayout}>
            <Text style={{ fontSize: FONT_SIZE }}>{LONG_TEXT}</Text>
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

function HuggingInRowProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  const onLayout = useSettledLayout(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH, flexDirection: 'row' }}>
      <Text style={{ flex: 1 }}>{LONG_TEXT}</Text>
      <Host>
        <RNHostView matchContents boundedByHost>
          <View style={{ width: BOX_WIDTH, height: BOX_HEIGHT }} onLayout={onLayout} />
        </RNHostView>
      </Host>
    </View>
  );
}

function ParentResizeProbe({ onMeasured }: { onMeasured: (sizes: AcrossChange) => void }) {
  const { changed, onLayout } = useAcrossChange(onMeasured);

  return (
    <View style={{ width: changed ? NARROW_WIDTH : PARENT_WIDTH }}>
      <Host>
        <RNHostView matchContents boundedByHost>
          <View style={{ width: '100%' }} onLayout={onLayout}>
            <Text style={{ fontSize: FONT_SIZE }}>{LONG_TEXT}</Text>
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

function ContentGrowthProbe({ onMeasured }: { onMeasured: (sizes: AcrossChange) => void }) {
  const { changed, onLayout } = useAcrossChange(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH, alignItems: 'flex-start' }}>
      <Host>
        <RNHostView matchContents boundedByHost>
          <View onLayout={onLayout}>
            <Text style={{ fontSize: FONT_SIZE }}>{changed ? LONG_TEXT : TEXT}</Text>
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

function MenuTriggerProbe({ onMeasured }: { onMeasured: (sizes: AcrossChange) => void }) {
  const { changed, onLayout } = useAcrossChange(onMeasured);

  return (
    <View style={{ width: changed ? NARROW_WIDTH : PARENT_WIDTH }}>
      <MenuView actions={[{ id: 'open', title: 'Open' }]}>
        <View style={{ width: '100%' }} onLayout={onLayout}>
          <Text style={{ fontSize: FONT_SIZE }}>{LONG_TEXT}</Text>
        </View>
      </MenuView>
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

    it('fills the width the parent offers and wraps text', async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <FillingProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - PARENT_WIDTH)).toBeLessThan(TOLERANCE);
      expect(size.height).toBeGreaterThan(FONT_SIZE * 1.5);
    });

    it('hugs small content in a row instead of filling it', async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <HuggingInRowProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - BOX_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(size.height - BOX_HEIGHT)).toBeLessThan(TOLERANCE);
    });

    it('follows the parent when it narrows and widens again', async () => {
      const { before, changed, restored } = await mountAndWaitForWithTimeout<AcrossChange>(
        <ParentResizeProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(before.width - PARENT_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(changed.width - NARROW_WIDTH)).toBeLessThan(TOLERANCE);
      expect(changed.height).toBeGreaterThan(before.height);
      expect(Math.abs(restored.width - before.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(restored.height - before.height)).toBeLessThan(TOLERANCE);
    });

    it('grows with its content up to the parent width, then wraps', async () => {
      const { before, changed, restored } = await mountAndWaitForWithTimeout<AcrossChange>(
        <ContentGrowthProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(before.width).toBeLessThan(PARENT_WIDTH / 2);
      expect(changed.width).toBeLessThan(PARENT_WIDTH + TOLERANCE);
      expect(changed.width).toBeGreaterThan(PARENT_WIDTH * 0.8);
      expect(changed.height).toBeGreaterThan(before.height);
      expect(Math.abs(restored.width - before.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(restored.height - before.height)).toBeLessThan(TOLERANCE);
    });

    // Regression test for https://github.com/expo/expo/issues/52194
    it('fills and wraps a MenuView trigger within its parent, as the parent resizes', async () => {
      const { before, changed, restored } = await mountAndWaitForWithTimeout<AcrossChange>(
        <MenuTriggerProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(before.width - PARENT_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(changed.width - NARROW_WIDTH)).toBeLessThan(TOLERANCE);
      expect(changed.height).toBeGreaterThan(before.height);
      expect(Math.abs(restored.width - before.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(restored.height - before.height)).toBeLessThan(TOLERANCE);
    });
  });
}
