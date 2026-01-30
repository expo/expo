import {
  Box,
  Column,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  ListItem,
  Spacer,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxSize,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import { Color, Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { cornerRadii } from '@/components/ClickableListItem';

interface HistoryItem {
  time: number;
  title: string;
  lang: string;
  description?: string;
}

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const MOCK_HISTORY: HistoryItem[] = [
  {
    time: Date.now() - 1000 * 60 * 30,
    title: 'React (software)',
    lang: 'en',
    description: 'JavaScript library for building user interfaces',
  },
  {
    time: Date.now() - HOUR * 2,
    title: 'TypeScript',
    lang: 'en',
    description: 'Programming language developed by Microsoft',
  },
  {
    time: Date.now() - HOUR * 3,
    title: 'Node.js',
    lang: 'en',
    description: 'Open-source, cross-platform JavaScript runtime environment',
  },
  {
    time: Date.now() - HOUR * 5,
    title: 'Expo (framework)',
    lang: 'en',
    description: 'Framework for building React Native applications',
  },
  {
    time: Date.now() - HOUR * 7,
    title: 'GraphQL',
    lang: 'en',
    description: 'Data query and manipulation language for APIs',
  },
  {
    time: Date.now() - DAY - HOUR * 1,
    title: 'Kotlin (programming language)',
    lang: 'en',
    description: 'Cross-platform, statically typed programming language',
  },
  {
    time: Date.now() - DAY - HOUR * 3,
    title: 'Jetpack Compose',
    lang: 'en',
    description: "Android's modern toolkit for building native UI",
  },
  {
    time: Date.now() - DAY - HOUR * 6,
    title: 'Rust (programming language)',
    lang: 'en',
    description: 'Multi-paradigm, general-purpose programming language emphasizing safety',
  },
  {
    time: Date.now() - DAY - HOUR * 8,
    title: 'WebAssembly',
    lang: 'en',
    description: 'Binary instruction format for a stack-based virtual machine',
  },
  {
    time: Date.now() - DAY * 3 - HOUR * 2,
    title: 'Wikipedia',
    lang: 'en',
    description: 'Free online encyclopedia',
  },
  {
    time: Date.now() - DAY * 3 - HOUR * 4,
    title: 'Material Design',
    lang: 'en',
    description: 'Design system developed by Google',
  },
  {
    time: Date.now() - DAY * 3 - HOUR * 6,
    title: 'Linux',
    lang: 'en',
    description: 'Family of open-source Unix-like operating systems',
  },
  {
    time: Date.now() - DAY * 5 - HOUR * 1,
    title: 'Android (operating system)',
    lang: 'en',
    description: 'Mobile operating system based on the Linux kernel',
  },
  {
    time: Date.now() - DAY * 5 - HOUR * 5,
    title: 'Artificial intelligence',
    lang: 'en',
    description: 'Intelligence demonstrated by machines',
  },
  {
    time: Date.now() - DAY * 5 - HOUR * 9,
    title: 'Open-source software',
    lang: 'en',
    description: 'Software with source code available for modification',
  },
];

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 1000 * 60 * 60 * 24;

  if (timestamp >= todayStart) {
    return 'Today';
  }
  if (timestamp >= yesterdayStart) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function groupByDate(items: HistoryItem[]): Map<string, HistoryItem[]> {
  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const label = formatDateLabel(item.time);
    const group = groups.get(label);
    if (group) {
      group.push(item);
    } else {
      groups.set(label, [item]);
    }
  }
  return groups;
}

function buildWikipediaUrl(item: HistoryItem): string {
  const slug = item.title.replace(/ /g, '_');
  return `https://${item.lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
}

export default function History() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(MOCK_HISTORY);

  const groupedHistory = useMemo(() => groupByDate(historyItems), [historyItems]);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Host matchContents>
              <IconButton onPress={() => setHistoryItems([])}>
                <Icon source={require('@/assets/symbols/delete.xml')} tintColor="#1d1b20" />
              </IconButton>
            </Host>
          ),
        }}
      />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        {historyItems.length === 0 ? (
          <Box modifiers={[fillMaxSize()]} contentAlignment="center">
            <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
              <Box contentAlignment="center">
                <Spacer
                  modifiers={[
                    clip(Shapes.Material.Cookie12Sided),
                    background(Color.android.dynamic.primaryContainer),
                    paddingAll(32),
                    size(100, 100),
                  ]}
                />
                <Icon
                  source={require('@/assets/symbols/history.xml')}
                  tintColor={Color.android.dynamic.onPrimaryContainer}
                  modifiers={[size(100, 100)]}
                />
              </Box>
              <Spacer modifiers={[height(8)]} />
              <Text style={{ typography: 'titleLarge', textAlign: 'center' }}>
                No history items
              </Text>
              <Text
                style={{ typography: 'bodyMedium', textAlign: 'center' }}
                modifiers={[padding(48, 0, 48, 0)]}>
                Articles you view will show up here
              </Text>
            </Column>
          </Box>
        ) : (
          <LazyColumn
            verticalArrangement={{ spacedBy: 2 }}
            contentPadding={{ start: 16, end: 16, top: 8, bottom: 16 }}>
            {Array.from(groupedHistory.entries()).map(([dateLabel, items]) => [
              <Text
                key={`${dateLabel}-header`}
                style={{ typography: 'titleSmall' }}
                modifiers={[padding(32, 14, 32, 14)]}>
                {dateLabel}
              </Text>,
              ...items.map((item, index) => {
                const itemPosition =
                  items.length === 1
                    ? undefined
                    : index === 0
                      ? 'leading'
                      : index === items.length - 1
                        ? 'trailing'
                        : undefined;

                return (
                  <ListItem
                    key={`${item.time}`}
                    headline={item.title}
                    supportingText={item.description}
                    modifiers={[
                      clip(
                        Shapes.RoundedCorner(
                          items.length === 1
                            ? { topStart: 20, topEnd: 20, bottomStart: 20, bottomEnd: 20 }
                            : cornerRadii(itemPosition)
                        )
                      ),
                      clickable(() =>
                        router.push({
                          pathname: '/page',
                          params: {
                            title: item.title,
                            url: buildWikipediaUrl(item),
                          },
                        })
                      ),
                    ]}>
                    <ListItem.Leading>
                      <Box
                        modifiers={[
                          clip(
                            Shapes.RoundedCorner({
                              topStart: 16,
                              topEnd: 16,
                              bottomStart: 16,
                              bottomEnd: 16,
                            })
                          ),
                          background(Color.android.dynamic.surfaceVariant),
                          size(64, 64),
                        ]}
                        contentAlignment="center">
                        <Text style={{ typography: 'titleMedium' }}>
                          {item.title.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    </ListItem.Leading>
                    <ListItem.Trailing>
                      <Text style={{ typography: 'bodySmall' }}>{formatTime(item.time)}</Text>
                    </ListItem.Trailing>
                  </ListItem>
                );
              }),
            ])}
          </LazyColumn>
        )}
      </Host>
    </>
  );
}
