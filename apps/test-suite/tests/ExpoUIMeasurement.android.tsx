import PagerView from '@expo/ui/community/pager-view';
import { Box, Column, Host, ModalBottomSheet, RNHostView, Row } from '@expo/ui/jetpack-compose';
import { padding, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import React from 'react';
import { ScrollView, View } from 'react-native';

export const name = 'ExpoUIMeasurement';

// Compose positions hosted content, Yoga does not. Yoga puts the hosted view's box at the `Host`'s
// origin no matter where Compose drew it, so `measure()` has to be corrected by the position Compose
// actually used — otherwise the responder region sits away from the content and a `Pressable` drops
// its press as soon as the finger moves.
//
// Compose reports placement in pixels and we publish it as dp, so an expected position is a float
// round-trip through the screen density, not an integer. Positions are therefore compared within
// half a dp — still far tighter than the smallest real failure, which is off by a whole `PADDING`.
const PADDING = 24;
const BOX = 40;
// Deliberately asymmetric, and different from `PADDING`, so a swapped axis cannot pass.
const OFFSET_START = 64;
const OFFSET_TOP = 48;
// A second hosted box, a different shape from `BOX` so no expected number is repeated.
const WIDE = 200;
const SHORT = 30;
// A Compose-only sibling: takes real width on screen and contributes no Yoga height at all.
const SPACER = 80;
// Scroll fixture. The filler is taller than any screen, because a `ScrollView` clamps `scrollTo` to
// its own content and would otherwise scroll less than asked without saying so.
const SCROLL_LEAD = 80;
const SCROLL_TAIL = 2000;
const SCROLL_BY = 60;
// Tall enough that a page's Yoga box is nowhere near the pager's origin, so reporting the wrong one
// cannot pass by accident.
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

// Deliberately `measure` rather than `measureInWindow`: `Pressability` uses this one, and compares
// `pageX`/`pageY` against the touch, so this is the path a hosted press actually depends on.
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
 * Measures every view in the set once the whole set reports the same positions twice in a row.
 *
 * Every assertion here is a difference between two views, so both readings have to come from the
 * same layout. Settling one view and then the next lets a commit land in between — Compose publishes
 * placement from its own layout pass, and the portal swaps content between tests — which leaves the
 * difference stale even though each half of it settled. Unlike polling until the numbers match, a
 * wrong position settles too, and still fails.
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

    // The case Yoga cannot see. Padding on a Compose column moves the hosted view, and nothing about
    // that reaches the shadow tree: Yoga still has the box at the `Host`'s origin. Without the
    // published content origin this reports the Yoga box and the assertion fails by the padding.
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

    // Two hosted views in one column. The second one's Yoga box no longer starts at the `Host`'s
    // origin — Yoga stacks it below the first — so reporting where Compose drew it means discarding
    // the Yoga position rather than adding to it. With a single hosted view that term is 0 and the
    // question never comes up, which is what makes this the case that constrains the implementation.
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

    // A row, where Compose's main axis is Yoga's cross axis. The sibling is a Compose-only view, so
    // it takes real width on screen while contributing no Yoga height — Yoga leaves the hosted box at
    // the origin and Compose pushes it across, past a sibling Yoga never accounted for.
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

    // The same row with the Compose-only sibling replaced by a second hosted view, so the two layout
    // systems disagree about the axis itself: Yoga stacks them in its own column while Compose puts
    // them side by side. Yoga's answer for the second box is therefore below where Compose drew it.
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
      // Side by side, both at the top: the second is one wide box across, and on the SAME row. That
      // shared Y is what fails if the Yoga position is added instead of replaced, because Yoga has
      // the second box a whole `SHORT` further down.
      expect(second.pageX - first.pageX).toBeCloseTo(WIDE, 0);
      expect(second.pageY - host.pageY).toBeCloseTo(PADDING, 0);
    });

    // The `Host` inside a React Native `ScrollView`. Two content origins now stack in one chain: the
    // `ScrollView` publishes its scroll offset through the same hook, and the hosted view publishes
    // Compose's placement. A press lands correctly only if the gap between them is scroll-invariant.
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

      // `measure` reads the scroll offset out of the shadow tree, so it lands a commit after the
      // scroll itself. Poll for the expected movement rather than guessing at a delay, then settle
      // the whole set again so the assertions below compare one layout against itself.
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
      // Against the anchor that does not scroll: counted twice or not at all, the scroll offset fails
      // here while the differences above stay right, because those two views scroll together.
      expect(after.hosted.pageY - after.viewport.pageY).toBeCloseTo(
        SCROLL_LEAD + PADDING - SCROLL_BY,
        0
      );
    });

    // A real component built on hosted views, and the case a synthetic tree cannot produce: the page
    // you are on is drawn at the pager's origin, so it publishes `(0, 0)` — a true position that is
    // indistinguishable from "nothing published" unless the registry answers presence rather than a
    // value. Yoga meanwhile stacks that page a full page below. Reporting the Yoga box here is the
    // shape of #46386, where a hosted `Pressable` stopped responding on every page after the first.
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
      // Waiting for the pager to report the change, rather than polling until the numbers look
      // right: a wrong position settles too, and polling for the expected answer would hide it.
      await Promise.race([selected, delay(3000)]);

      const after = await measureWhenSettled({ pager: pagerWrapperRef, second: secondRef });
      expect(after.second.pageX - after.pager.pageX).toBeCloseTo(0, 0);
      expect(after.second.pageY - after.pager.pageY).toBeCloseTo(0, 0);
    });

    // A modal bottom sheet is a separate window with no React root above it, so the hosted view
    // dispatches its own touches and is measured from itself. Every other case here reports surface
    // coordinates; this one must report zero, which is what says the measure walk stopped at the node.
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
