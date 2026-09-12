import { BottomSheet, Host, HStack, RNHostView, VStack } from '@expo/ui/swift-ui';
import { padding } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { ScrollView, View } from 'react-native';

// React Native types `View` as a function component, so the instance type is its ref type.
type ViewRef = React.ComponentRef<typeof View>;
type ScrollViewRef = React.ComponentRef<typeof ScrollView>;

// Tests that the actual placement of the UI matches what RN's measure API returns.
// UI is placed by SwiftUI and not Yoga, so these tests check that the placement reported to RN is correct and Pressability works.
export const name = 'ExpoUIMeasurement';
const PADDING = 24;
const BOX = 40;
const WIDE = 200;
const SHORT = 30;
const SCROLL_LEAD = 80;
const SCROLL_TAIL = 2000;
const SCROLL_BY = 60;

type Measurement = {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
};

function measureAsync(ref: React.RefObject<ViewRef | null>, label = 'view'): Promise<Measurement> {
  return new Promise((resolve, reject) => {
    const node = ref.current;
    if (!node) {
      reject(new Error(`Cannot measure ${label}: it is not mounted`));
      return;
    }
    node.measure((x, y, width, height, pageX, pageY) =>
      resolve({ x, y, width, height, pageX, pageY })
    );
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Measures once the view exists and reports a real size. Content that is presented — a sheet — only
 * mounts when it is on screen and animates in, so there is no single layout callback to wait on.
 */
async function measureWhenPresented(
  ref: React.RefObject<ViewRef | null>,
  label: string,
  timeoutMs = 5000
): Promise<Measurement> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (ref.current) {
      const measurement = await measureAsync(ref, label).catch(() => null);
      if (measurement != null && measurement.width > 0 && measurement.height > 0) {
        return measurement;
      }
    }
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label} to be presented and laid out`);
}

export async function test(
  { it, describe, expect, afterEach }: any,
  { setPortalChild, cleanupPortal }: any
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  describe(name, () => {
    it('measures a hosted view where SwiftUI placed it, not where Yoga put its box', async () => {
      const hostWrapperRef = React.createRef<ViewRef>();
      const hostedRef = React.createRef<ViewRef>();

      let onLaidOut: () => void;
      const laidOut = new Promise<void>((resolve) => {
        onLaidOut = resolve;
      });

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents onLayoutContent={() => onLaidOut()}>
            <VStack modifiers={[padding({ all: PADDING })]}>
              <RNHostView matchContents>
                <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </VStack>
          </Host>
        </View>
      );

      await laidOut;

      const host = await measureAsync(hostWrapperRef);
      const hosted = await measureAsync(hostedRef);

      expect(hosted.pageX - host.pageX).toBe(PADDING);
      expect(hosted.pageY - host.pageY).toBe(PADDING);

      expect(hosted.width).toBeCloseTo(BOX, 0);
      expect(hosted.height).toBeCloseTo(BOX, 0);
    });

    it('measures a hosted view stacked below another hosted view', async () => {
      const hostWrapperRef = React.createRef<ViewRef>();
      const firstRef = React.createRef<ViewRef>();
      const secondRef = React.createRef<ViewRef>();

      let onLaidOut: () => void;
      const laidOut = new Promise<void>((resolve) => {
        onLaidOut = resolve;
      });

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents onLayoutContent={() => onLaidOut()}>
            <VStack modifiers={[padding({ all: PADDING })]}>
              <RNHostView matchContents>
                <View ref={firstRef} style={{ width: WIDE, height: SHORT }} />
              </RNHostView>
              <RNHostView matchContents>
                <View ref={secondRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </VStack>
          </Host>
        </View>
      );

      await laidOut;

      const host = await measureAsync(hostWrapperRef);
      const first = await measureAsync(firstRef);
      const second = await measureAsync(secondRef);

      expect(first.pageX - host.pageX).toBe(PADDING);
      expect(first.pageY - host.pageY).toBe(PADDING);
      expect(second.pageX - host.pageX).toBe(PADDING + (WIDE - BOX) / 2);
      expect(second.pageY - host.pageY).toBe(host.height - PADDING - BOX);
    });

    it('measures a hosted view in a row, beside a SwiftUI-only sibling', async () => {
      const hostWrapperRef = React.createRef<ViewRef>();
      const hostedRef = React.createRef<ViewRef>();

      let onLaidOut: () => void;
      const laidOut = new Promise<void>((resolve) => {
        onLaidOut = resolve;
      });

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents onLayoutContent={() => onLaidOut()}>
            <HStack modifiers={[padding({ all: PADDING })]}>
              <HStack modifiers={[padding({ all: PADDING })]}>{null}</HStack>
              <RNHostView matchContents>
                <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </HStack>
          </Host>
        </View>
      );

      await laidOut;

      const host = await measureAsync(hostWrapperRef);
      const hosted = await measureAsync(hostedRef);

      expect(hosted.pageX - host.pageX).toBe(host.width - PADDING - BOX);
      expect(hosted.pageY - host.pageY).toBe(PADDING + (PADDING * 2 - BOX) / 2);
    });

    it('measures a hosted view in a row, beside another hosted view', async () => {
      const hostWrapperRef = React.createRef<ViewRef>();
      const firstRef = React.createRef<ViewRef>();
      const secondRef = React.createRef<ViewRef>();

      let onLaidOut: () => void;
      const laidOut = new Promise<void>((resolve) => {
        onLaidOut = resolve;
      });

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents onLayoutContent={() => onLaidOut()}>
            <HStack modifiers={[padding({ all: PADDING })]}>
              <RNHostView matchContents>
                <View ref={firstRef} style={{ width: WIDE, height: SHORT }} />
              </RNHostView>
              <RNHostView matchContents>
                <View ref={secondRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </HStack>
          </Host>
        </View>
      );

      await laidOut;

      const host = await measureAsync(hostWrapperRef);
      const first = await measureAsync(firstRef);
      const second = await measureAsync(secondRef);
      const rowHeight = Math.max(SHORT, BOX);
      expect(first.pageX - host.pageX).toBe(PADDING);
      expect(first.pageY - host.pageY).toBe(PADDING + (rowHeight - SHORT) / 2);
      expect(second.pageX - host.pageX).toBe(host.width - PADDING - BOX);
      expect(second.pageY - host.pageY).toBe(PADDING + (rowHeight - BOX) / 2);
    });

    it('measures a hosted view when the Host is inside a React Native ScrollView', async () => {
      const scrollRef = React.createRef<ScrollViewRef>();
      // Anchored outside the `ScrollView`, so it does not move when the content does. Measuring
      // against it gives the box's real position on screen, which is what a touch is compared
      // against — a difference between two views that scroll together would cancel the scroll
      // offset out and never notice if it were wrong.
      const viewportRef = React.createRef<ViewRef>();
      const hostWrapperRef = React.createRef<ViewRef>();
      const hostedRef = React.createRef<ViewRef>();

      let onLaidOut: () => void;
      const laidOut = new Promise<void>((resolve) => {
        onLaidOut = resolve;
      });

      let onScrollable: () => void;
      const scrollable = new Promise<void>((resolve) => {
        onScrollable = resolve;
      });

      setPortalChild(
        <View ref={viewportRef} collapsable={false} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            // Keep the content's start at the viewport's top edge. Left to iOS, a safe-area inset
            // would be folded in and the resting position would depend on the surrounding screen.
            contentInsetAdjustmentBehavior="never"
            onContentSizeChange={(_width, height) => {
              if (height >= SCROLL_LEAD + SCROLL_TAIL) {
                onScrollable();
              }
            }}>
            <View style={{ height: SCROLL_LEAD }} />
            <View ref={hostWrapperRef} collapsable={false}>
              <Host matchContents onLayoutContent={() => onLaidOut()}>
                <VStack modifiers={[padding({ all: PADDING })]}>
                  <RNHostView matchContents>
                    <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
                  </RNHostView>
                </VStack>
              </Host>
            </View>
            <View style={{ height: SCROLL_TAIL }} />
          </ScrollView>
        </View>
      );

      await Promise.all([laidOut, scrollable]);

      const viewport = await measureAsync(viewportRef, 'the scroll viewport');
      const hostBefore = await measureAsync(hostWrapperRef, 'the Host wrapper');
      const hostedBefore = await measureAsync(hostedRef, 'the hosted box');

      expect(hostedBefore.pageX - hostBefore.pageX).toBe(PADDING);
      expect(hostedBefore.pageY - hostBefore.pageY).toBe(PADDING);

      // Against the anchor that does not scroll: the box sits below the lead spacer, plus the
      // stack's padding.
      expect(hostedBefore.pageX - viewport.pageX).toBe(PADDING);
      expect(hostedBefore.pageY - viewport.pageY).toBe(SCROLL_LEAD + PADDING);

      scrollRef.current?.scrollTo({ y: SCROLL_BY, animated: false });

      let hostAfter = hostBefore;
      for (let attempt = 0; attempt < 40; attempt++) {
        hostAfter = await measureAsync(hostWrapperRef);
        if (Math.abs(hostBefore.pageY - hostAfter.pageY - SCROLL_BY) < 0.5) {
          break;
        }
        await delay(50);
      }
      const hostedAfter = await measureAsync(hostedRef);

      // The scroll reached the shadow tree, and it moved both views by the same amount.
      expect(hostBefore.pageY - hostAfter.pageY).toBeCloseTo(SCROLL_BY, 0);
      expect(hostedAfter.pageX - hostAfter.pageX).toBe(PADDING);
      expect(hostedAfter.pageY - hostAfter.pageY).toBe(PADDING);

      // Against the fixed anchor, the box has moved up the screen by exactly the scroll. This is the
      // assertion a wrong scroll offset cannot hide from: counted twice or not at all, it fails here
      // while the differences above stay right, because those two views scroll together.
      expect(hostedAfter.pageX - viewport.pageX).toBe(PADDING);
      expect(hostedAfter.pageY - viewport.pageY).toBe(SCROLL_LEAD + PADDING - SCROLL_BY);
    });

    // A sheet content uses RootNodeKind trait so measurement happens relative to the RNHostView and not the RN's root surface.
    it('measures a hosted view in a sheet relative to itself', async () => {
      const hostedRef = React.createRef<ViewRef>();

      setPortalChild(
        <Host matchContents>
          <VStack modifiers={[padding({ all: PADDING })]}>
            <BottomSheet isPresented onIsPresentedChange={() => {}} fitToContents>
              <VStack modifiers={[padding({ all: PADDING })]}>
                <RNHostView matchContents>
                  <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
                </RNHostView>
              </VStack>
            </BottomSheet>
          </VStack>
        </Host>
      );

      const hosted = await measureWhenPresented(hostedRef, 'the hosted box in a sheet');

      // The measure walk stops at the hosting view, so the hosted content sits at its origin. This
      // is the same space the touches dispatched here arrive in — without it they would be compared
      // against a position in a surface the sheet is not part of.
      expect(hosted.pageX).toBe(0);
      expect(hosted.pageY).toBe(0);
      expect(hosted.width).toBeCloseTo(BOX, 0);
      expect(hosted.height).toBeCloseTo(BOX, 0);
    });

    it('measures a hosted view nested inside sheet content from the outer hosted view', async () => {
      const nestedRef = React.createRef<ViewRef>();

      setPortalChild(
        <Host matchContents>
          <VStack>
            <BottomSheet isPresented onIsPresentedChange={() => {}} fitToContents>
              <RNHostView matchContents>
                <View collapsable={false} style={{ padding: PADDING }}>
                  <Host matchContents>
                    <RNHostView matchContents>
                      <View ref={nestedRef} style={{ width: BOX, height: BOX }} />
                    </RNHostView>
                  </Host>
                </View>
              </RNHostView>
            </BottomSheet>
          </VStack>
        </Host>
      );

      const nested = await measureWhenPresented(nestedRef, 'the nested hosted box in a sheet');

      expect(nested.pageX).toBeCloseTo(PADDING, 0);
      expect(nested.pageY).toBeCloseTo(PADDING, 0);
      expect(nested.width).toBeCloseTo(BOX, 0);
      expect(nested.height).toBeCloseTo(BOX, 0);
    });
  });
}
