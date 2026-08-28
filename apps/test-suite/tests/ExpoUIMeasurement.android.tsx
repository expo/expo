import PagerView from '@expo/ui/community/pager-view';
import { Box, Column, Host, ModalBottomSheet, RNHostView, Row } from '@expo/ui/jetpack-compose';
import { padding, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import React from 'react';
import { ScrollView, View } from 'react-native';

// Tests actual placement of UI matches return returned by RN's measure API.
// UI is placed by Compose and not Yoga, so these tests test that correct placement is reported to RN so Pressability can work correctly.
export const name = 'ExpoUIMeasurement';
const PADDING = 24;
const BOX = 40;
const OFFSET_START = 64;
const OFFSET_TOP = 48;
const WIDE = 200;
const SHORT = 30;
const SPACER = 80;
const SCROLL_LEAD = 80;
const SCROLL_TAIL = 2000;
const SCROLL_BY = 60;
const PAGER_HEIGHT = 300;

type Measurement = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Origin relative to the surface root — what `Pressability` builds its responder region from. */
  pageX: number;
  pageY: number;
};

function measureAsync(ref: React.RefObject<View | null>, label = 'view'): Promise<Measurement> {
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
 * Measures the given views together, returning once they all report the same positions twice in
 * a row.
 *
 */
async function measureWhenSettled<T extends Record<string, React.RefObject<View | null>>>(
  refs: T,
  timeoutMs = 5000
): Promise<Record<keyof T, Measurement>> {
  const started = Date.now();
  const names = Object.keys(refs) as (keyof T)[];
  let previous: Record<keyof T, Measurement> | null = null;

  while (Date.now() - started < timeoutMs) {
    const pass = {} as Record<keyof T, Measurement>;
    let readEverything = true;

    for (const measuredName of names) {
      const ref = refs[measuredName];
      // `measure` drops its callback entirely for a view that is not mounted yet, rather than
      // reporting zeros, so an unguarded await here wedges the loop instead of retrying.
      const measurement = ref.current
        ? await Promise.race([
            measureAsync(ref, String(measuredName)).catch(() => null),
            delay(250).then(() => null),
          ])
        : null;
      if (measurement == null || measurement.width === 0 || measurement.height === 0) {
        readEverything = false;
        break;
      }
      pass[measuredName] = measurement;
    }

    if (readEverything) {
      const settled =
        previous != null &&
        names.every(
          (measuredName) =>
            previous![measuredName].pageX === pass[measuredName].pageX &&
            previous![measuredName].pageY === pass[measuredName].pageY
        );
      if (settled) {
        return pass;
      }
      previous = pass;
    }

    await delay(50);
  }
  throw new Error(`Timed out waiting for ${names.join(', ')} to settle`);
}

export async function test(
  { it, describe, expect, afterEach }: any,
  { setPortalChild, cleanupPortal }: any
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  describe(name, () => {
    it('measures a hosted view where Compose placed it', async () => {
      const hostWrapperRef = React.createRef<View>();
      const hostedRef = React.createRef<View>();

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <Column modifiers={[paddingAll(PADDING)]}>
              <RNHostView matchContents>
                <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </Column>
          </Host>
        </View>
      );

      const { host, hosted } = await measureWhenSettled({
        host: hostWrapperRef,
        hosted: hostedRef,
      });

      // `Column` is start-aligned, so the box sits exactly one padding in on both axes.
      expect(hosted.pageX - host.pageX).toBeCloseTo(PADDING, 0);
      expect(hosted.pageY - host.pageY).toBeCloseTo(PADDING, 0);
      expect(hosted.width).toBeCloseTo(BOX, 0);
      expect(hosted.height).toBeCloseTo(BOX, 0);
    });

    it('measures a hosted view offset by its own padding modifier', async () => {
      const hostWrapperRef = React.createRef<View>();
      const hostedRef = React.createRef<View>();

      // The padding sits on the `RNHostView` itself, which is what the universal `RNHostView`
      // makes of `style={{ padding }}`. Compose applies a modifier chain outside-in, so the
      // content origin has to be read inside this padding, not outside it.
      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <RNHostView matchContents modifiers={[paddingAll(PADDING)]}>
              <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
            </RNHostView>
          </Host>
        </View>
      );

      const { host, hosted } = await measureWhenSettled({
        host: hostWrapperRef,
        hosted: hostedRef,
      });

      expect(hosted.pageX - host.pageX).toBeCloseTo(PADDING, 0);
      expect(hosted.pageY - host.pageY).toBeCloseTo(PADDING, 0);
    });

    it('measures a hosted view offset by a padded Compose column', async () => {
      const hostWrapperRef = React.createRef<View>();
      const hostedRef = React.createRef<View>();

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <Column modifiers={[padding(OFFSET_START, OFFSET_TOP, PADDING, PADDING)]}>
              <RNHostView matchContents>
                <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </Column>
          </Host>
        </View>
      );

      const { host, hosted } = await measureWhenSettled({
        host: hostWrapperRef,
        hosted: hostedRef,
      });

      expect(hosted.pageX - host.pageX).toBeCloseTo(OFFSET_START, 0);
      expect(hosted.pageY - host.pageY).toBeCloseTo(OFFSET_TOP, 0);
    });

    it('measures a hosted view stacked below another hosted view', async () => {
      const hostWrapperRef = React.createRef<View>();
      const firstRef = React.createRef<View>();
      const secondRef = React.createRef<View>();

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <Column modifiers={[paddingAll(PADDING)]}>
              <RNHostView matchContents>
                <View ref={firstRef} style={{ width: WIDE, height: SHORT }} />
              </RNHostView>
              <RNHostView matchContents>
                <View ref={secondRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </Column>
          </Host>
        </View>
      );

      const { host, first, second } = await measureWhenSettled({
        host: hostWrapperRef,
        first: firstRef,
        second: secondRef,
      });

      expect(first.pageX - host.pageX).toBeCloseTo(PADDING, 0);
      expect(first.pageY - host.pageY).toBeCloseTo(PADDING, 0);
      // Both start-aligned, and the second sits exactly the first's height below it. Deriving the
      // gap rather than the absolute position keeps the column's arrangement out of the expectation.
      expect(second.pageX - host.pageX).toBeCloseTo(PADDING, 0);
      expect(second.pageY - first.pageY).toBeCloseTo(SHORT, 0);
    });

    it('measures a hosted view in a row, beside a Compose-only sibling', async () => {
      const hostWrapperRef = React.createRef<View>();
      const hostedRef = React.createRef<View>();

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <Row modifiers={[paddingAll(PADDING)]}>
              <Box modifiers={[size(SPACER, SPACER)]} />
              <RNHostView matchContents>
                <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </Row>
          </Host>
        </View>
      );

      const { host, hosted } = await measureWhenSettled({
        host: hostWrapperRef,
        hosted: hostedRef,
      });

      expect(hosted.pageX - host.pageX).toBeCloseTo(PADDING + SPACER, 0);
      expect(hosted.pageY - host.pageY).toBeCloseTo(PADDING, 0);
    });

    it('measures a hosted view in a row, beside another hosted view', async () => {
      const hostWrapperRef = React.createRef<View>();
      const firstRef = React.createRef<View>();
      const secondRef = React.createRef<View>();

      setPortalChild(
        <View ref={hostWrapperRef} collapsable={false}>
          <Host matchContents>
            <Row modifiers={[paddingAll(PADDING)]}>
              <RNHostView matchContents>
                <View ref={firstRef} style={{ width: WIDE, height: SHORT }} />
              </RNHostView>
              <RNHostView matchContents>
                <View ref={secondRef} style={{ width: BOX, height: BOX }} />
              </RNHostView>
            </Row>
          </Host>
        </View>
      );

      const { host, first, second } = await measureWhenSettled({
        host: hostWrapperRef,
        first: firstRef,
        second: secondRef,
      });

      expect(first.pageX - host.pageX).toBeCloseTo(PADDING, 0);
      expect(first.pageY - host.pageY).toBeCloseTo(PADDING, 0);
      expect(second.pageX - first.pageX).toBeCloseTo(WIDE, 0);
      expect(second.pageY - host.pageY).toBeCloseTo(PADDING, 0);
    });

    it('measures a hosted view when the Host is inside a React Native ScrollView', async () => {
      const scrollRef = React.createRef<ScrollView>();
      // Anchored outside the `ScrollView` so it does not move with the content. A difference between
      // two views that scroll together would cancel the scroll offset out and never notice it.
      const viewportRef = React.createRef<View>();
      const hostWrapperRef = React.createRef<View>();
      const hostedRef = React.createRef<View>();

      setPortalChild(
        <View ref={viewportRef} collapsable={false} style={{ flex: 1 }}>
          <ScrollView ref={scrollRef}>
            <View style={{ height: SCROLL_LEAD }} />
            <View ref={hostWrapperRef} collapsable={false}>
              <Host matchContents>
                <Column modifiers={[paddingAll(PADDING)]}>
                  <RNHostView matchContents>
                    <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
                  </RNHostView>
                </Column>
              </Host>
            </View>
            <View style={{ height: SCROLL_TAIL }} />
          </ScrollView>
        </View>
      );

      const views = { viewport: viewportRef, host: hostWrapperRef, hosted: hostedRef };
      const before = await measureWhenSettled(views);

      expect(before.hosted.pageX - before.host.pageX).toBeCloseTo(PADDING, 0);
      expect(before.hosted.pageY - before.host.pageY).toBeCloseTo(PADDING, 0);
      expect(before.hosted.pageY - before.viewport.pageY).toBeCloseTo(SCROLL_LEAD + PADDING, 0);

      scrollRef.current?.scrollTo({ y: SCROLL_BY, animated: false });

      for (let attempt = 0; attempt < 40; attempt++) {
        const host = await measureAsync(hostWrapperRef, 'the Host wrapper');
        if (Math.abs(before.host.pageY - host.pageY - SCROLL_BY) < 0.5) {
          break;
        }
        await delay(50);
      }
      const after = await measureWhenSettled(views);

      expect(before.host.pageY - after.host.pageY).toBeCloseTo(SCROLL_BY, 0);
      expect(after.hosted.pageY - after.host.pageY).toBeCloseTo(PADDING, 0);
      expect(after.hosted.pageY - after.viewport.pageY).toBeCloseTo(
        SCROLL_LEAD + PADDING - SCROLL_BY,
        0
      );
    });

    it('measures a PagerView page where Compose drew it, after paging to it', async () => {
      const pagerWrapperRef = React.createRef<View>();
      const pagerRef = React.createRef<any>();
      const firstRef = React.createRef<View>();
      const secondRef = React.createRef<View>();

      let onSelected: ((position: number) => void) | null = null;
      const selected = new Promise<number>((resolve) => {
        onSelected = resolve;
      });

      setPortalChild(
        <View ref={pagerWrapperRef} collapsable={false} style={{ height: PAGER_HEIGHT }}>
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            onPageSelected={(event: any) => onSelected?.(event.nativeEvent.position)}>
            <View key="first">
              <View ref={firstRef} style={{ width: BOX, height: BOX }} />
            </View>
            <View key="second">
              <View ref={secondRef} style={{ width: BOX, height: BOX }} />
            </View>
          </PagerView>
        </View>
      );

      const before = await measureWhenSettled({ pager: pagerWrapperRef, first: firstRef });
      expect(before.first.pageX - before.pager.pageX).toBeCloseTo(0, 0);
      expect(before.first.pageY - before.pager.pageY).toBeCloseTo(0, 0);

      pagerRef.current?.setPageWithoutAnimation(1);
      await Promise.race([selected, delay(3000)]);

      const after = await measureWhenSettled({ pager: pagerWrapperRef, second: secondRef });
      expect(after.second.pageX - after.pager.pageX).toBeCloseTo(0, 0);
      expect(after.second.pageY - after.pager.pageY).toBeCloseTo(0, 0);
    });

    it('measures a hosted view in a modal bottom sheet relative to itself', async () => {
      const hostedRef = React.createRef<View>();

      setPortalChild(
        <Host matchContents>
          <Column modifiers={[paddingAll(PADDING)]}>
            <ModalBottomSheet onDismissRequest={() => {}}>
              <Column modifiers={[paddingAll(PADDING)]}>
                <RNHostView matchContents>
                  <View ref={hostedRef} style={{ width: BOX, height: BOX }} />
                </RNHostView>
              </Column>
            </ModalBottomSheet>
          </Column>
        </Host>
      );

      const { hosted } = await measureWhenSettled({ hosted: hostedRef });

      expect(hosted.pageX).toBe(0);
      expect(hosted.pageY).toBe(0);
      expect(hosted.width).toBeCloseTo(BOX, 0);
      expect(hosted.height).toBeCloseTo(BOX, 0);
    });
  });
}
