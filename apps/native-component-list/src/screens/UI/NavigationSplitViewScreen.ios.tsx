import {
  Button,
  Divider,
  Host,
  HStack,
  Image,
  List,
  NavigationSplitView,
  type NavigationSplitViewColumn,
  type NavigationSplitViewVisibility,
  ScrollView,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  listRowBackground,
  listStyle,
  navigationSplitViewColumnWidth,
  navigationSplitViewStyle,
  navigationTitle,
  opacity,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { PlatformColor } from 'react-native';

type Message = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  date: string;
  unread: boolean;
  body: string[];
};

const MESSAGES: Message[] = [
  {
    id: 'release',
    sender: 'Priya Raman',
    subject: 'Release notes for 58.0.0',
    preview:
      'Draft is ready for review. I have grouped the breaking changes by platform so the migration reads in one pass.',
    time: '09:24',
    date: 'Today at 09:24',
    unread: true,
    body: [
      'Draft is ready for review. I have grouped the breaking changes by platform so the migration reads in one pass.',
      'The only section I am unsure about is the layout change. It affects anyone who relied on the old centering behaviour, and I would rather over-explain it than have people find out from a bug report.',
      'Could you read that paragraph and tell me whether the suggested fix is the one you would give someone in a support thread?',
    ],
  },
  {
    id: 'split',
    sender: 'Marco Belli',
    subject: 'Split view on the larger screens',
    preview:
      'Tried the three column layout on the tablet build. The middle column is doing the right thing at every width.',
    time: '08:51',
    date: 'Today at 08:51',
    unread: true,
    body: [
      'Tried the three column layout on the tablet build. The middle column is doing the right thing at every width.',
      'One note: when the window gets narrow enough to collapse, we land on the sidebar rather than on the message the user was reading. That is the right default for a fresh launch, but it feels wrong mid-task.',
      'Worth checking whether we should follow the selection instead once something is open.',
    ],
  },
  {
    id: 'design',
    sender: 'Ada Okafor',
    subject: 'Icon set, second pass',
    preview:
      'Reworked the outline weights so they hold up at the small size. The old set went muddy below 20 points.',
    time: 'Yesterday',
    date: 'Yesterday at 17:02',
    unread: false,
    body: [
      'Reworked the outline weights so they hold up at the small size. The old set went muddy below 20 points.',
      'I also dropped the two icons we could never agree on. Neither was carrying its weight, and the row reads better without them.',
      'Files are in the shared folder. Shout if the weights still feel heavy next to the system symbols.',
    ],
  },
  {
    id: 'support',
    sender: 'Support digest',
    subject: 'Weekly summary: 12 open, 31 closed',
    preview:
      'Two themes this week. Upgrade questions are down, and layout questions are up after the release.',
    time: 'Yesterday',
    date: 'Yesterday at 08:00',
    unread: false,
    body: [
      'Two themes this week. Upgrade questions are down, and layout questions are up after the release.',
      'The layout reports are nearly all the same root cause, so a short note in the docs would probably close most of them before they are filed.',
    ],
  },
  {
    id: 'offsite',
    sender: 'Jonas Lind',
    subject: 'Offsite agenda',
    preview: 'Pencilled you in for the Thursday session. Thirty minutes, no slides required.',
    time: 'Monday',
    date: 'Monday at 14:37',
    unread: false,
    body: [
      'Pencilled you in for the Thursday session. Thirty minutes, no slides required.',
      'The room has a proper display this time, so a live demo will actually be readable from the back.',
    ],
  },
  {
    id: 'invoice',
    sender: 'Billing',
    subject: 'Your receipt',
    preview: 'No action needed. A copy has been added to the account.',
    time: 'Monday',
    date: 'Monday at 06:12',
    unread: false,
    body: ['No action needed. A copy has been added to the account.'],
  },
];

// Icon-only actions, matching SwiftUI's `Button(role:action:)` with an image label.
const ACTIONS = [
  'arrowshape.turn.up.left',
  'arrowshape.turn.up.right',
  'archivebox',
  'trash',
] as const;

export default function NavigationSplitViewScreen() {
  const [selectedId, setSelectedId] = React.useState<string>(MESSAGES[0].id);
  const [readIds, setReadIds] = React.useState<string[]>(() =>
    MESSAGES.filter((message) => !message.unread).map((message) => message.id)
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<NavigationSplitViewVisibility>('automatic');
  const [compactColumn, setCompactColumn] = React.useState<NavigationSplitViewColumn>('sidebar');

  const selected = MESSAGES.find((message) => message.id === selectedId) ?? MESSAGES[0];

  const open = (message: Message) => {
    setSelectedId(message.id);
    // Opening a message marks it read, so the unread dot has to come from state
    // rather than from the message itself.
    setReadIds((current) => (current.includes(message.id) ? current : [...current, message.id]));
    // Collapsed to one column, the split view has to be told to show the detail.
    // SwiftUI moves it back to the sidebar itself when the back button is used.
    setCompactColumn('detail');
  };

  const toggleSidebar = () => {
    setColumnVisibility((current) => (current === 'detailOnly' ? 'all' : 'detailOnly'));
  };

  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView
        columnVisibility={columnVisibility}
        // The user can drag the divider, so the state follows the layout rather
        // than forcing it.
        onColumnVisibilityChange={setColumnVisibility}
        // Controlled in both directions: opening a message moves the collapsed split
        // view to the detail, and the system back button moves it back.
        preferredCompactColumn={compactColumn}
        onPreferredCompactColumnChange={setCompactColumn}
        modifiers={[navigationSplitViewStyle('balanced')]}>
        <NavigationSplitView.Sidebar>
          <List
            modifiers={[
              navigationTitle('Inbox'),
              listStyle('plain'),
              navigationSplitViewColumnWidth({ min: 260, ideal: 320, max: 420 }),
            ]}>
            {MESSAGES.map((message) => {
              const isSelected = message.id === selected.id;
              const isUnread = !readIds.includes(message.id);
              return (
                <Button
                  key={message.id}
                  modifiers={[
                    buttonStyle('plain'),
                    // A semantic fill follows light and dark mode; a hardcoded tint would not.
                    listRowBackground(isSelected ? PlatformColor('systemFill') : 'clear'),
                  ]}
                  onPress={() => open(message)}>
                  <HStack spacing={10} modifiers={[padding({ vertical: 6 })]}>
                    <Image
                      systemName="circle.fill"
                      size={9}
                      modifiers={[foregroundStyle('tint'), opacity(isUnread ? 1 : 0)]}
                    />
                    <VStack alignment="leading" spacing={3}>
                      <HStack>
                        <Text modifiers={[font({ textStyle: 'headline' })]}>{message.sender}</Text>
                        <Spacer />
                        <Text
                          modifiers={[
                            font({ textStyle: 'caption' }),
                            foregroundStyle('secondaryLabel'),
                          ]}>
                          {message.time}
                        </Text>
                      </HStack>
                      <Text modifiers={[font({ textStyle: 'subheadline' })]}>
                        {message.subject}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle('secondaryLabel'),
                          lineLimit(2),
                        ]}>
                        {message.preview}
                      </Text>
                    </VStack>
                  </HStack>
                </Button>
              );
            })}
          </List>
        </NavigationSplitView.Sidebar>

        <NavigationSplitView.Detail>
          <ScrollView modifiers={[navigationTitle(selected.sender)]}>
            <VStack alignment="leading" spacing={18} modifiers={[padding({ all: 24 })]}>
              <HStack>
                <Text modifiers={[font({ textStyle: 'title' })]}>{selected.subject}</Text>
                <Spacer />
                {/* Collapsed on the detail, the split view already supplies a back button,
                    so a second way back would be redundant. */}
                {compactColumn === 'detail' ? null : (
                  <Button systemImage="sidebar.left" onPress={toggleSidebar} />
                )}
              </HStack>

              <HStack spacing={12}>
                <Image
                  systemName="person.crop.circle.fill"
                  size={40}
                  modifiers={[foregroundStyle('tint')]}
                />
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ textStyle: 'headline' })]}>{selected.sender}</Text>
                  <Text
                    modifiers={[font({ textStyle: 'caption' }), foregroundStyle('secondaryLabel')]}>
                    To: me
                  </Text>
                </VStack>
                <Spacer />
                <Text
                  modifiers={[font({ textStyle: 'caption' }), foregroundStyle('secondaryLabel')]}>
                  {selected.date}
                </Text>
              </HStack>

              <Divider />

              {/* Readable text keeps a maximum width instead of stretching with the column. */}
              {selected.body.map((paragraph, index) => (
                <Text key={index} modifiers={[frame({ maxWidth: 680, alignment: 'leading' })]}>
                  {paragraph}
                </Text>
              ))}

              <Divider />

              <HStack spacing={28}>
                {ACTIONS.map((action) => (
                  <Button key={action} systemImage={action} onPress={() => {}} />
                ))}
                <Spacer />
              </HStack>
            </VStack>
          </ScrollView>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    </Host>
  );
}

NavigationSplitViewScreen.navigationOptions = {
  title: 'NavigationSplitView',
};
