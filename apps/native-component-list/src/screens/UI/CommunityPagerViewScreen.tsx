import PagerView from '@expo/ui/community/pager-view';
import * as React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Adapted from https://github.com/callstack/react-native-pager-view/tree/master/example

const PAGE_COLORS = ['#6200EE', '#03DAC5', '#FF5722', '#E91E63', '#3F51B5'];

function ColorPage({ index, label }: { index: number; label?: string }) {
  return (
    <View style={[styles.page, { backgroundColor: PAGE_COLORS[index % PAGE_COLORS.length] }]}>
      <Text style={styles.pageText}>{label ?? `Page ${index + 1}`}</Text>
    </View>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function BasicSection() {
  const pagerRef = React.useRef<React.ComponentRef<typeof PagerView>>(null);
  const [page, setPage] = React.useState(0);

  return (
    <Section
      title="Basic — imperative navigation"
      hint="setPage animates; setPageWithoutAnimation jumps.">
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}>
        <ColorPage key="1" index={0} />
        <ColorPage key="2" index={1} />
        <ColorPage key="3" index={2} />
      </PagerView>
      <View style={styles.row}>
        <Button title="Prev" onPress={() => pagerRef.current?.setPage(Math.max(0, page - 1))} />
        <Text style={styles.label}>Page {page + 1} / 3</Text>
        <Button title="Next" onPress={() => pagerRef.current?.setPage(Math.min(2, page + 1))} />
      </View>
      <Button
        title="Jump to last (no anim)"
        onPress={() => pagerRef.current?.setPageWithoutAnimation(2)}
      />
    </Section>
  );
}

function ScrollProgressSection() {
  const progress = useSharedValue(0);
  const [state, setState] = React.useState<'idle' | 'dragging' | 'settling'>('idle');
  const pageCount = 4;

  const onPageScroll = (e: { nativeEvent: { position: number; offset: number } }) => {
    'worklet';
    progress.value = e.nativeEvent.position + e.nativeEvent.offset;
  };

  const progressBarFill = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value / (pageCount - 1))) * 100}%`,
  }));

  const blockJSFor = (ms: number) => {
    const end = Date.now() + ms;
    // eslint-disable-next-line no-empty
    while (Date.now() < end) {}
  };

  return (
    <Section
      title="Continuous scroll progress (worklet)"
      hint="onPageScroll runs as a worklet on the UI thread; the bar tracks the swipe even while the JS thread is blocked. iOS 18+ only.">
      <View style={styles.progressBarTrack}>
        <Reanimated.View style={[styles.progressBarFill, progressBarFill]} />
      </View>
      <PagerView
        style={styles.pager}
        onPageScroll={onPageScroll}
        onPageScrollStateChanged={(e) => setState(e.nativeEvent.pageScrollState)}>
        <ColorPage key="1" index={0} label="Swipe →" />
        <ColorPage key="2" index={1} />
        <ColorPage key="3" index={2} />
        <ColorPage key="4" index={3} label="Last" />
      </PagerView>
      <View style={[styles.stateBadge, styles.stateBadgeAlign, stateBadgeStyle(state)]}>
        <Text style={styles.stateBadgeText}>{state}</Text>
      </View>
      <Button title="Block JS for 4 seconds" onPress={() => blockJSFor(4000)} />
    </Section>
  );
}

function stateBadgeStyle(state: 'idle' | 'dragging' | 'settling') {
  switch (state) {
    case 'dragging':
      return { backgroundColor: '#03DAC5' };
    case 'settling':
      return { backgroundColor: '#FF9800' };
    case 'idle':
    default:
      return { backgroundColor: '#9E9E9E' };
  }
}

function ToggleScrollSection() {
  const pagerRef = React.useRef<React.ComponentRef<typeof PagerView>>(null);
  const [enabled, setEnabled] = React.useState(true);

  return (
    <Section
      title="Toggle scroll"
      hint="setScrollEnabled disables user swipes; programmatic navigation still works.">
      <PagerView ref={pagerRef} style={styles.pager} scrollEnabled={enabled}>
        <ColorPage key="1" index={0} label={enabled ? 'Swipe enabled' : 'Swipe disabled'} />
        <ColorPage key="2" index={1} label="Page 2" />
        <ColorPage key="3" index={2} label="Page 3" />
      </PagerView>
      <View style={styles.row}>
        <Button
          title={enabled ? 'Disable swipe' : 'Enable swipe'}
          onPress={() => {
            const next = !enabled;
            setEnabled(next);
            pagerRef.current?.setScrollEnabled(next);
          }}
        />
        <Button title="Go to page 3" onPress={() => pagerRef.current?.setPage(2)} />
      </View>
    </Section>
  );
}

function DynamicPagesSection() {
  const [pages, setPages] = React.useState([0, 1, 2]);
  const pagerRef = React.useRef<React.ComponentRef<typeof PagerView>>(null);
  const [current, setCurrent] = React.useState(0);

  return (
    <Section title="Dynamic pages" hint="Add or remove pages while the pager stays mounted.">
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        onPageSelected={(e) => setCurrent(e.nativeEvent.position)}>
        {pages.map((id, i) => (
          <ColorPage key={String(id)} index={id} label={`Page ${i + 1} / ${pages.length}`} />
        ))}
      </PagerView>
      <View style={styles.row}>
        <Button
          title="Add"
          onPress={() =>
            setPages((prev) => [...prev, prev.length === 0 ? 0 : prev[prev.length - 1] + 1])
          }
        />
        <Text style={styles.label}>
          Showing {current + 1} / {pages.length}
        </Text>
        <Button
          title="Remove last"
          onPress={() => setPages((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
        />
      </View>
    </Section>
  );
}

function InitialPageSection() {
  return (
    <Section
      title="Initial page"
      hint="initialPage={2} — pager should boot showing 'Page 3 (initial)'. Read once on mount; later changes are ignored.">
      <PagerView style={styles.pager} initialPage={2}>
        <ColorPage key="1" index={0} />
        <ColorPage key="2" index={1} />
        <ColorPage key="3" index={2} label="Page 3 (initial)" />
        <ColorPage key="4" index={3} />
      </PagerView>
    </Section>
  );
}

function RTLSection() {
  const [rtl, setRtl] = React.useState(false);

  return (
    <Section title="Layout direction" hint="Toggle between LTR and RTL paging (Android only).">
      <PagerView
        key={rtl ? 'rtl' : 'ltr'}
        style={styles.pager}
        layoutDirection={rtl ? 'rtl' : 'ltr'}>
        <ColorPage key="1" index={0} label="First" />
        <ColorPage key="2" index={1} label="Second" />
        <ColorPage key="3" index={2} label="Third" />
      </PagerView>
      <Button title={rtl ? 'Switch to LTR' : 'Switch to RTL'} onPress={() => setRtl((v) => !v)} />
    </Section>
  );
}

export default function CommunityPagerViewScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ScrollProgressSection />
      <InitialPageSection />
      <BasicSection />
      <ToggleScrollSection />
      <DynamicPagesSection />
      <RTLSection />
    </ScrollView>
  );
}

CommunityPagerViewScreen.navigationOptions = {
  title: 'Community PagerView replacement',
};

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionHint: { fontSize: 12, color: '#666' },
  pager: { height: 240, borderRadius: 12, overflow: 'hidden' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: { fontSize: 15, fontWeight: '600' },
  progressBarTrack: { height: 6, borderRadius: 3, backgroundColor: '#EEE', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6200EE' },
  stateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stateBadgeAlign: { alignSelf: 'flex-start' },
  stateBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
