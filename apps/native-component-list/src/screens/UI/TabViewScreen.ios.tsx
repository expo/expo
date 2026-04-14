import {
  Button,
  Form,
  Host,
  Section,
  Spacer,
  TabView,
  Text,
  TextField,
  Toggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  animation,
  Animation,
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  indexViewStyle,
  padding,
  tabItem,
  tabViewStyle,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

// TabView itself imposes no height, so we pin one to give each section a
// predictable footprint inside the parent Form.
const PAGE_HEIGHT = 500;

const PAGE_COLORS = [
  '#6200EE',
  '#03DAC5',
  '#FF5722',
  '#4CAF50',
  '#2196F3',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
];

const tabViewFrame = frame({ minHeight: PAGE_HEIGHT, maxHeight: PAGE_HEIGHT });
const fillFrame = frame({ maxWidth: Infinity, maxHeight: Infinity });

// VStack stacks top-down by default; bookending the content with Spacers
// vertically centers it within the fill frame. `modifiers` extends the base
// chain so callers can append things like `tabItem(...)` for bottom-tab demos.
function ColorPage({
  index,
  label,
  modifiers = [],
}: {
  index: number;
  label?: string;
  modifiers?: ViewModifier[];
}) {
  const color = PAGE_COLORS[index % PAGE_COLORS.length];
  return (
    <VStack
      alignment="center"
      spacing={0}
      modifiers={[fillFrame, background(color), clipShape('roundedRectangle', 12), ...modifiers]}>
      <Spacer />
      <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
        {label ?? `Page ${index + 1}`}
      </Text>
      <Spacer />
    </VStack>
  );
}

// Per-page TextField is uncontrolled (defaultValue, no value/onValueChange) so
// the typed text lives in the native UITextField — not in React state. This
// makes the section a regression test for the TabView ForEach identity: if the
// native ForEach keyed rows by index instead of by stable child id, removing
// the first page would leave the typed text on the wrong page.
//
// `index` is the note's stable identity (also doubles as the React key and the
// label). Prepending a new note doesn't shift existing notes' indices —
// instead the new note gets a negative index. That way each note keeps its
// color and label across inserts/removes.
function NotePage({ index }: { index: number }) {
  const color = PAGE_COLORS[Math.abs(index) % PAGE_COLORS.length];
  return (
    <VStack
      alignment="center"
      spacing={12}
      modifiers={[
        fillFrame,
        padding({ horizontal: 24 }),
        background(color),
        clipShape('roundedRectangle', 12),
      ]}>
      <Spacer />
      <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
        Note {index}
      </Text>
      <TextField
        defaultValue=""
        placeholder={`Type into note ${index}…`}
        modifiers={[
          padding({ all: 12 }),
          background('#FFFFFF'),
          frame({ width: 240 }),
          clipShape('roundedRectangle', 8),
        ]}
      />
      <Spacer />
    </VStack>
  );
}

export default function TabViewScreen() {
  // 1. uncontrolled
  const [uncontrolledPage, setUncontrolledPage] = React.useState(1);

  // dots toggle — drives a `tabViewStyle` modifier shared across all pagers below
  const [showDots, setShowDots] = React.useState(true);
  const dotsModifier = tabViewStyle({
    type: 'page',
    indexDisplayMode: showDots ? 'always' : 'never',
  });

  // 3. programmatic navigation
  const NAV_COUNT = 5;
  const [sel2, setSel2] = React.useState(0);

  // 4. reorderable notes — per-page native state must travel with content.
  // Each note's `index` is its stable identity (used for label, color, key).
  // Existing notes start at 1, 2, 3; prepended notes count down to 0, -1, -2,
  // so existing notes never get a new index when the array shifts.
  const [notes, setNotes] = React.useState<{ index: number }[]>([
    { index: 1 },
    { index: 2 },
    { index: 3 },
  ]);
  const nextPrependedIndex = React.useRef(0);
  const [selNotes, setSelNotes] = React.useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Uncontrolled">
          <Text>
            No selection prop — native owns the state. Starts at the second page via
            initialSelection. The `tabViewStyle({"{ type: 'page' }"})` modifier opts in to the
            swipeable page style.
          </Text>
          <Text>Last reported page: {uncontrolledPage + 1}</Text>
          <TabView
            initialSelection={1}
            onSelectionChange={setUncontrolledPage}
            modifiers={[tabViewFrame, tabViewStyle({ type: 'page' })]}>
            <ColorPage index={0} />
            <ColorPage index={1} />
            <ColorPage index={2} />
          </TabView>
        </Section>

        <Section title="Bottom tab bar (automatic style)">
          <Text>
            Pass `tabViewStyle({"{ type: 'automatic' }"})` to opt in to the SwiftUI bottom tab bar
            style and apply `tabItem({'{...}'})` to each child to give the tabs labels and icons.
            For routed full-screen tabs, prefer `expo-router/unstable-native-tabs`.
          </Text>
          <TabView modifiers={[tabViewFrame, tabViewStyle({ type: 'automatic' })]}>
            <ColorPage
              index={0}
              label="Home"
              modifiers={[tabItem({ label: 'Home', systemImage: 'house.fill' })]}
            />
            <ColorPage
              index={1}
              label="Search"
              modifiers={[tabItem({ label: 'Search', systemImage: 'magnifyingglass' })]}
            />
            <ColorPage
              index={2}
              label="Profile"
              modifiers={[tabItem({ label: 'Profile', systemImage: 'person.crop.circle' })]}
            />
          </TabView>
        </Section>

        <Section title="Indicator dots">
          <Text>
            indexViewStyle and backgroundDisplayMode "always" shows a translucent pill behind the
            dots:
          </Text>
          <TabView
            modifiers={[
              tabViewFrame,
              tabViewStyle({ type: 'page', indexDisplayMode: 'always' }),
              indexViewStyle({ backgroundDisplayMode: 'always' }),
            ]}>
            <ColorPage index={5} />
            <ColorPage index={6} />
            <ColorPage index={7} />
          </TabView>
          <Toggle
            isOn={showDots}
            onIsOnChange={setShowDots}
            label="Show dots on other pagers below"
          />
        </Section>

        <Section title="Programmatic navigation (controlled)">
          <Text>
            Page {sel2 + 1} / {NAV_COUNT}
          </Text>
          <TabView
            selection={sel2}
            onSelectionChange={setSel2}
            modifiers={[tabViewFrame, dotsModifier, animation(Animation.default, sel2)]}>
            {Array.from({ length: NAV_COUNT }).map((_, i) => (
              <ColorPage key={i} index={i} />
            ))}
          </TabView>
          <Button onPress={() => setSel2(0)} label="First" />
          <Button onPress={() => setSel2(Math.max(0, sel2 - 1))} label="Prev" />
          <Button onPress={() => setSel2(Math.min(NAV_COUNT - 1, sel2 + 1))} label="Next" />
          <Button onPress={() => setSel2(NAV_COUNT - 1)} label="Last" />
          <Button onPress={() => setSel2(-1)} label="-1" />
          <Button onPress={() => setSel2(NAV_COUNT)} label="Last + 1" />
        </Section>

        <Section title="Reorderable notes (state stays with content)">
          <Text>
            Each page hosts an uncontrolled native TextField. Type something into note 2, then tap
            “Insert at beginning”. The text should travel with note 2 (now at array position 1), not
            stay at array position 1 with a brand-new page.
          </Text>
          <Text>
            Notes: {notes.map((n) => n.index).join(', ')} — selected{' '}
            {notes[Math.min(selNotes, notes.length - 1)]?.index ?? '–'}
          </Text>
          <TabView
            selection={Math.min(selNotes, notes.length - 1)}
            onSelectionChange={setSelNotes}
            modifiers={[tabViewFrame, dotsModifier]}>
            {notes.map((note) => (
              <NotePage key={note.index} index={note.index} />
            ))}
          </TabView>
          <Button
            onPress={() => {
              const index = nextPrependedIndex.current--;
              setNotes((prev) => [{ index }, ...prev]);
              // Keep the same logical page selected after the front insert.
              setSelNotes((s) => s + 1);
            }}
            label="Insert at beginning"
          />
          <Button
            onPress={() => {
              if (notes.length <= 1) return;
              setNotes((prev) => prev.slice(1));
              setSelNotes((s) => Math.max(0, s - 1));
            }}
            label="Remove first"
          />
        </Section>
      </Form>
    </Host>
  );
}

TabViewScreen.navigationOptions = {
  title: 'TabView',
};
