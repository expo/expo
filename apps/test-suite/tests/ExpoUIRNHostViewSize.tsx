import { Column, Host, RNHostView } from '@expo/ui';
import React from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

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
const HOST_WIDTH = 200;
const HOST_HEIGHT = 120;
const COLUMN_PADDING = 8;
const TEXT = 'Hello, world!';
const LONG_TEXT = 'a much longer string that has to wrap when the width is limited';
const FONT_SIZE = 24;
const CONTENT_MAX_WIDTH = 140;
const CONTENT_MIN_HEIGHT = 60;
const LOOP_WINDOW_MS = 1500;

type Axes = { width: number; height: number };
type Paired = { hosted: Axes; control: Axes };
type AcrossChange = { before: Axes; grown: Axes; shrunk: Axes };

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

// Regression test for Host + RNHostView layout loops https://github.com/expo/expo/pull/48059#issuecomment-5351404485
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

function ContentLimitsProbe({ onMeasured }: { onMeasured: (size: Axes) => void }) {
  const onLayout = useSettledLayout(onMeasured);

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host matchContents>
        <RNHostView matchContents onLayout={onLayout}>
          <View style={{ maxWidth: CONTENT_MAX_WIDTH, minHeight: CONTENT_MIN_HEIGHT }}>
            <Text style={{ fontSize: FONT_SIZE }}>{LONG_TEXT}</Text>
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

function HostedOnLayoutProbe({ onMeasured }: { onMeasured: (sizes: Paired) => void }) {
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
        <RNHostView
          matchContents
          onLayout={({ nativeEvent }) => report('control', nativeEvent.layout)}>
          <View
            style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
            onLayout={({ nativeEvent }) => report('hosted', nativeEvent.layout)}
          />
        </RNHostView>
      </Host>
    </View>
  );
}

function ResizeProbe({ onMeasured }: { onMeasured: (sizes: AcrossChange) => void }) {
  const [step, setStep] = React.useState(0);
  const seen = React.useRef<Partial<AcrossChange>>({});

  const onLayout = useSettledLayout((size) => {
    if (step === 0) {
      seen.current.before = size;
      setStep(1);
    } else if (step === 1) {
      seen.current.grown = size;
      setStep(2);
    } else if (step === 2) {
      const { before, grown } = seen.current;
      if (before && grown) {
        onMeasured({ before, grown, shrunk: size });
      }
    }
  });

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host matchContents>
        <RNHostView matchContents onLayout={onLayout}>
          <View style={{ height: BOX_HEIGHT }}>
            <Text style={{ fontSize: FONT_SIZE }}>{step === 1 ? LONG_TEXT : TEXT}</Text>
          </View>
        </RNHostView>
      </Host>
    </View>
  );
}

// Regression test for the layout loop in https://github.com/expo/expo/issues/48058.
// It needs a constant amount of native chrome around content that stretches to the width it is
// offered. Measuring that content at the width the previous pass produced added the chrome again
// every round, so the width grew by a constant forever.
function DivergenceProbe({ onMeasured }: { onMeasured: (widths: number[]) => void }) {
  const widths = React.useRef<number[]>([]);
  const closed = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    if (closed.current) {
      return;
    }
    widths.current.push(nativeEvent.layout.width);

    timer.current ??= setTimeout(() => {
      closed.current = true;
      onMeasured(widths.current);
    }, LOOP_WINDOW_MS);
  };

  return (
    <View style={{ width: PARENT_WIDTH }}>
      <Host matchContents>
        <Column style={{ padding: COLUMN_PADDING }}>
          <RNHostView matchContents onLayout={onLayout}>
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

    it("honours the hosted view's own maxWidth and minHeight", async () => {
      const size = await mountAndWaitForWithTimeout<Axes>(
        <ContentLimitsProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(size.width - CONTENT_MAX_WIDTH)).toBeLessThan(TOLERANCE);
      expect(size.height).toBeGreaterThan(FONT_SIZE * 1.5);
      expect(size.height).toBeGreaterThanOrEqual(CONTENT_MIN_HEIGHT - TOLERANCE);
    });

    it('fires onLayout on the hosted element, at the size the host reports', async () => {
      const { hosted, control } = await mountAndWaitForWithTimeout<Paired>(
        <HostedOnLayoutProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(Math.abs(hosted.width - BOX_WIDTH)).toBeLessThan(TOLERANCE);
      expect(Math.abs(hosted.height - BOX_HEIGHT)).toBeLessThan(TOLERANCE);
      expect(Math.abs(hosted.width - control.width)).toBeLessThan(TOLERANCE);
      expect(Math.abs(hosted.height - control.height)).toBeLessThan(TOLERANCE);
    });

    // Regression test for https://github.com/expo/expo/issues/47883
    it('tracks hosted content that changes size after mount, both ways', async () => {
      const { before, grown, shrunk } = await mountAndWaitForWithTimeout<AcrossChange>(
        <ResizeProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(grown.width).toBeGreaterThan(before.width);
      expect(Math.abs(shrunk.width - before.width)).toBeLessThan(TOLERANCE);
    });

    // Regression test for https://github.com/expo/expo/issues/48058
    it('settles at the content width when native chrome wraps stretching content', async () => {
      const widths = await mountAndWaitForWithTimeout<number[]>(
        <DivergenceProbe onMeasured={() => {}} />,
        'onMeasured',
        setPortalChild,
        TIMEOUT_MS
      );

      expect(widths.length).toBeGreaterThan(0);
      // A diverging layout grew the width for as long as it was measured.
      expect(Math.abs(widths[widths.length - 1] - widths[0])).toBeLessThan(TOLERANCE);
      // The width the parent offers never reaches the content.
      expect(Math.abs(Math.max(...widths) - BOX_WIDTH)).toBeLessThan(TOLERANCE);
    });
  });
}
