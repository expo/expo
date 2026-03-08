import { Host, WorkletList } from '@expo/ui/swift-ui';
import { installOnUIRuntime } from 'expo-modules-core/src/worklets';
import * as React from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';

type FeedItem = {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  body: string;
  timeAgo: string;
  likes: number;
  comments: number;
  reposts: number;
  hasImage: boolean;
  imageIcon: string;
  accentColor: string;
  verified: boolean;
};

const USERNAMES = [
  'Sarah Chen',
  'Alex Rivera',
  'Mika Tanaka',
  'Jordan Lee',
  'Priya Patel',
  'Sam Wilson',
  'Elena Costa',
  'David Kim',
  'Olivia Brown',
  'Marcus Johnson',
  'Ava Nguyen',
  "Liam O'Brien",
  'Zoe Martinez',
  'Noah Williams',
  'Emma Davis',
];

const HANDLES = [
  'sarahc',
  'arivera',
  'mika_t',
  'jordanl',
  'priyap',
  'samw',
  'elenac',
  'dkim',
  'oliviab',
  'marcusj',
  'avan',
  'liamo',
  'zoem',
  'noahw',
  'emmad',
];

const AVATARS = [
  'person.crop.circle.fill',
  'person.crop.circle.fill',
  'person.crop.square.fill',
  'person.crop.circle.fill',
  'person.crop.circle.fill',
];

const POSTS = [
  "Just shipped a new feature! The team has been working on this for weeks and I'm so proud of what we built together.",
  'Hot take: tabs > spaces. Fight me.',
  "Anyone else feel like Monday is just a concept invented to test our patience? Anyway, here's my coffee.",
  'Finally finished reading that book everyone recommended. It was... mid. But the last chapter changed everything. Would recommend just for the ending alone tbh.',
  "TIL you can hold the spacebar on iOS to move the cursor. I've been using phones for 15 years.",
  'Deployed to prod on a Friday. Wish me luck.',
  'The sunset today was absolutely unreal. Nature really said "let me show you what I can do." Sometimes you just need to stop and appreciate the little things.',
  'lol',
  'Working from a coffee shop today. Productivity: 10%. Vibes: immaculate.',
  'Just had the best ramen of my life. The broth was simmered for 48 hours. I might cry.',
  'Controversial opinion: dark mode is overrated. There, I said it. The brightness is my friend.',
  'Started learning Rust this week. Day 1: "This is great!" Day 3: "What is a lifetime and why is it yelling at me?"',
  "Reminder: drink water. Yes, you. Right now. I'll wait.",
  'My cat just knocked my coffee off the desk and stared at me like I did something wrong.',
  'New blog post is up! Wrote about our migration from REST to GraphQL. Spoiler: it was worth it but not without pain.',
  'Thinking about starting a podcast. Is the world ready for another tech podcast? Probably not. Am I going to do it anyway? Absolutely.',
  'The gym at 5am hits different. And by different I mean painful. But also oddly satisfying.',
  "Just realized I've been mass-replying to the wrong Slack channel for 3 days. Cool cool cool.",
  'PSA: update your dependencies. I just found a 2-year-old lodash vulnerability in our codebase.',
  'Spent 4 hours debugging only to find a missing comma. I love this profession.',
];

const IMAGE_ICONS = [
  'photo.fill',
  'camera.fill',
  'mountain.2.fill',
  'leaf.fill',
  'cup.and.saucer.fill',
  'laptopcomputer',
  'book.fill',
  'sunset.fill',
];

const COLORS = ['blue', 'purple', 'orange', 'pink', 'green', 'red'];

// Simple seeded pseudo-random number generator (reproducible across reloads)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateFeed(count: number): FeedItem[] {
  const rand = mulberry32(42);
  return Array.from({ length: count }, (_, i) => {
    const userIdx = Math.floor(rand() * USERNAMES.length);
    const postIdx = Math.floor(rand() * POSTS.length);
    const hasImage = rand() > 0.6;
    const minutes = Math.floor(rand() * 1440);
    const timeAgo =
      minutes < 60
        ? `${minutes}m`
        : minutes < 1440
          ? `${Math.floor(minutes / 60)}h`
          : `${Math.floor(minutes / 1440)}d`;

    return {
      id: String(i),
      username: USERNAMES[userIdx],
      handle: '@' + HANDLES[userIdx],
      avatar: AVATARS[Math.floor(rand() * AVATARS.length)],
      body: POSTS[postIdx],
      timeAgo,
      likes: Math.floor(rand() * 5000),
      comments: Math.floor(rand() * 300),
      reposts: Math.floor(rand() * 800),
      hasImage,
      imageIcon: IMAGE_ICONS[Math.floor(rand() * IMAGE_ICONS.length)],
      accentColor: COLORS[Math.floor(rand() * COLORS.length)],
      verified: rand() > 0.6,
    };
  });
}

// Initialize the worklet UI runtime — required before using WorkletList.
try {
  installOnUIRuntime();
} catch (e) {
  console.warn('Failed to install UI runtime:', e);
}

export default function WorkletListScreen() {
  const [items] = React.useState(() => generateFeed(10_000));

  return (
    <View style={styles.container}>
      <RNText style={styles.header}>
        WorkletList — {items.length.toLocaleString()} posts (UI thread rendering)
      </RNText>
      <Host style={styles.list}>
        <WorkletList
          data={items}
          renderItem={(item: any, index: number) => {
            'worklet';
            console.log('globalThis', index);
            const h = globalThis.createElement;

            // Avatar column
            const avatar = h('Image', {
              systemName: item.avatar,
              size: 40,
              color: item.accentColor,
            });

            // Username row: name + verified badge + handle + time
            const nameRow = h(
              'HStack',
              { spacing: 4 },
              h('Text', { content: item.username, fontWeight: 'bold', fontSize: 15 }),
              item.verified
                ? h('Image', { systemName: 'checkmark.seal.fill', size: 14, color: 'blue' })
                : null,
              h('Text', { content: item.handle, color: 'gray', fontSize: 14 }),
              h('Text', { content: ' · ' + item.timeAgo, color: 'gray', fontSize: 14 })
            );

            // Post body
            const body = h('Text', { content: item.body, fontSize: 15 });

            // Optional image placeholder
            const imagePlaceholder = item.hasImage
              ? h(
                  'HStack',
                  { spacing: 8, padding: 12 },
                  h('Image', { systemName: item.imageIcon, size: 24, color: item.accentColor }),
                  h('Text', { content: 'Image attachment', color: 'gray', fontSize: 13 })
                )
              : null;

            // Action bar: reply, repost, like, share
            const formatCount = function (n: number) {
              if (n >= 1000) {
                return (n / 1000).toFixed(1) + 'K';
              }
              return String(n);
            };

            const actionBar = h(
              'HStack',
              { spacing: 0 },
              h(
                'HStack',
                { spacing: 4 },
                h('Image', { systemName: 'bubble.left', size: 14, color: 'gray' }),
                h('Text', { content: formatCount(item.comments), color: 'gray', fontSize: 12 })
              ),
              h('Spacer', null),
              h(
                'HStack',
                { spacing: 4 },
                h('Image', { systemName: 'arrow.2.squarepath', size: 14, color: 'gray' }),
                h('Text', { content: formatCount(item.reposts), color: 'gray', fontSize: 12 })
              ),
              h('Spacer', null),
              h(
                'HStack',
                { spacing: 4 },
                h('Image', { systemName: 'heart', size: 14, color: 'gray' }),
                h('Text', { content: formatCount(item.likes), color: 'gray', fontSize: 12 })
              ),
              h('Spacer', null),
              h('Image', { systemName: 'square.and.arrow.up', size: 14, color: 'gray' })
            );

            // Compose: avatar on left, content on right
            return h(
              'HStack',
              { spacing: 10, alignment: 'top', padding: 12 },
              avatar,
              h(
                'VStack',
                { spacing: 6, alignment: 'leading' },
                nameRow,
                body,
                imagePlaceholder,
                actionBar
              )
            );
          }}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    color: '#888',
    backgroundColor: '#f8f8f8',
  },
  list: {
    flex: 1,
  },
});
