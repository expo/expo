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
import type { TabProps } from '@expo/ui/swift-ui';
import {
  animation,
  Animation,
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  badge,
  indexViewStyle,
  padding,
  tabViewStyle,
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

function ColorPage({ index, label }: { index: number; label?: string }) {
  const color = PAGE_COLORS[index % PAGE_COLORS.length];
  return (
    <VStack
      alignment="center"
      spacing={0}
      modifiers={[fillFrame, background(color), clipShape('roundedRectangle', 12)]}>
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
  const [uncontrolledPage, setUncontrolledPage] = React.useState('1');

  // dots toggle — drives a `tabViewStyle` modifier shared across all pagers below
  const [showDots, setShowDots] = React.useState(true);
  const dotsModifier = tabViewStyle({
    type: 'page',
    indexDisplayMode: showDots ? 'always' : 'never',
  });

  // 3. programmatic navigation
  const NAV_COUNT = 5;
  const [sel2, setSel2] = React.useState('0');

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
  const [selNotes, setSelNotes] = React.useState('1');

  // 5. value-based selection — distinctive per-tab pages so it's visually
  // obvious that the selected tab stays selected when the bar is reordered.
  type MailTab = {
    value: string;
    label: string;
    systemImage: TabProps['systemImage'];
    emoji: string;
    color: string;
  };
  const [mailTabs, setMailTabs] = React.useState<MailTab[]>([
    { value: 'inbox', label: 'Inbox', systemImage: 'tray.fill', emoji: '📥', color: '#4F8DF6' },
    { value: 'sent', label: 'Sent', systemImage: 'paperplane.fill', emoji: '✈️', color: '#34C759' },
    {
      value: 'drafts',
      label: 'Drafts',
      systemImage: 'square.and.pencil',
      emoji: '📝',
      color: '#FF9F0A',
    },
    {
      value: 'archive',
      label: 'Archive',
      systemImage: 'archivebox.fill',
      emoji: '🗄️',
      color: '#AF52DE',
    },
  ]);
  const [selectedMail, setSelectedMail] = React.useState('drafts');
  const shuffleMail = () => {
    setMailTabs((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Selection survives reordering (iOS 18+)">
          <Text>
            Tap Shuffle: the bar reorders, but the page on screen stays the same — value-based
            selection follows the tab, not its position.
          </Text>
          <TabView
            selection={selectedMail}
            onSelectionChange={setSelectedMail}
            modifiers={[tabViewFrame, tabViewStyle({ type: 'sidebarAdaptable' })]}>
            {mailTabs.map((t) => (
              <TabView.Tab
                key={t.value}
                value={t.value}
                label={t.label}
                systemImage={t.systemImage}
                modifiers={t.value === 'inbox' ? [badge('3')] : undefined}>
                <VStack
                  alignment="center"
                  spacing={16}
                  modifiers={[fillFrame, background(t.color), clipShape('roundedRectangle', 16)]}>
                  <Spacer />
                  <Text modifiers={[font({ size: 96 })]}>{t.emoji}</Text>
                  <Text
                    modifiers={[font({ size: 28, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
                    {t.label}
                  </Text>
                  <Text modifiers={[font({ size: 14 }), foregroundStyle('#FFFFFFCC')]}>
                    value = "{t.value}"
                  </Text>
                  <Spacer />
                </VStack>
              </TabView.Tab>
            ))}
          </TabView>
          <Button onPress={shuffleMail} label="Shuffle tabs" />
        </Section>

        <Section title="Uncontrolled">
          <Text>
            No selection prop — native owns the state. Starts at the second page via
            defaultSelection. The `tabViewStyle({"{ type: 'page' }"})` modifier opts in to the
            swipeable page style.
          </Text>
          <Text>Last reported page: {uncontrolledPage}</Text>
          <TabView
            defaultSelection="1"
            onSelectionChange={setUncontrolledPage}
            modifiers={[tabViewFrame, tabViewStyle({ type: 'page' })]}>
            <TabView.Tab value="0">
              <ColorPage index={0} />
            </TabView.Tab>
            <TabView.Tab value="1">
              <ColorPage index={1} />
            </TabView.Tab>
            <TabView.Tab value="2">
              <ColorPage index={2} />
            </TabView.Tab>
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
            <TabView.Tab value="5">
              <ColorPage index={5} />
            </TabView.Tab>
            <TabView.Tab value="6">
              <ColorPage index={6} />
            </TabView.Tab>
            <TabView.Tab value="7">
              <ColorPage index={7} />
            </TabView.Tab>
          </TabView>
        </Section>

        <Section>
          <Toggle isOn={showDots} onIsOnChange={setShowDots} label="Show dots on pagers below" />
        </Section>

        <Section title="Programmatic navigation (controlled)">
          <Text>
            Page {Number(sel2) + 1} / {NAV_COUNT}
          </Text>
          <TabView
            selection={sel2}
            onSelectionChange={setSel2}
            modifiers={[tabViewFrame, dotsModifier, animation(Animation.default, Number(sel2))]}>
            {Array.from({ length: NAV_COUNT }).map((_, i) => (
              <TabView.Tab key={i} value={String(i)}>
                <ColorPage index={i} />
              </TabView.Tab>
            ))}
          </TabView>
          <Button onPress={() => setSel2('0')} label="First" />
          <Button onPress={() => setSel2(String(Math.max(0, Number(sel2) - 1)))} label="Prev" />
          <Button
            onPress={() => setSel2(String(Math.min(NAV_COUNT - 1, Number(sel2) + 1)))}
            label="Next"
          />
          <Button onPress={() => setSel2(String(NAV_COUNT - 1))} label="Last" />
          <Button onPress={() => setSel2('-1')} label="-1" />
          <Button onPress={() => setSel2(String(NAV_COUNT))} label="Last + 1" />
        </Section>

        <Section title="Reorderable notes (state stays with content)">
          <Text>
            Each page hosts an uncontrolled native TextField. Type something into note 2, then tap
            "Insert at beginning". The text should travel with note 2 (now at array position 1), not
            stay at array position 1 with a brand-new page.
          </Text>
          <Text>
            Notes: {notes.map((n) => n.index).join(', ')} — selected {selNotes}
          </Text>
          <TabView
            selection={selNotes}
            onSelectionChange={setSelNotes}
            modifiers={[tabViewFrame, dotsModifier]}>
            {notes.map((note) => (
              <TabView.Tab key={note.index} value={String(note.index)}>
                <NotePage index={note.index} />
              </TabView.Tab>
            ))}
          </TabView>
          <Button
            onPress={() => {
              const index = nextPrependedIndex.current--;
              setNotes((prev) => [{ index }, ...prev]);
              // No need to adjust selection — value-based selection
              // follows the note, not its position.
            }}
            label="Insert at beginning"
          />
          <Button
            onPress={() => {
              if (notes.length <= 1) return;
              const removedValue = String(notes[0].index);
              setNotes((prev) => prev.slice(1));
              if (selNotes === removedValue) {
                setSelNotes(String(notes[1]?.index ?? notes[0].index));
              }
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
