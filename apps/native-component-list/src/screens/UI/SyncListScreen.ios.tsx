import { SyncList } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_COUNT = 10_000;
const PHOTOS = [
  require('../../../assets/images/example1.jpg'),
  require('../../../assets/images/example2.jpg'),
  require('../../../assets/images/example3.jpg'),
];
const MESSAGES = [
  'Hey! Still up for a little exploring this weekend?',
  'Absolutely. I already have a few places saved 👀',
  'Look at this place!',
  'Okay, that architecture is incredible. Let’s go early so we have time to walk around and grab coffee afterward.',
  'Found a little guide for the trip:',
  'Perfect ☕️',
  'Voice message',
  'Made a loose plan. Nothing too ambitious — mostly good food, a long walk, and a few photos.',
  'Weekend itinerary.pdf',
  'Things to bring:\n• Camera + an extra battery\n• Something warm\n• Snacks for the road\n\nI’ll take care of the playlist 🎶',
  '📷 ✨',
  'This is going to be such a good weekend. See you at 9!',
];
const WAVEFORM = Array.from({ length: 28 }, (_, index) => 6 + ((index * 13 + 7) % 25));

// Generate only the mounted rows, rather than allocating 10,000 message objects.
// Rows have no local state, so a recycled cell can immediately represent another message.
function MessageRow({ index }: { index: number }) {
  const kind = index % MESSAGES.length;
  const outgoing =
    kind === 1 || kind === 3 || kind === 5 || kind === 7 || kind === 9 || kind === 11;
  const photo = PHOTOS[Math.floor(index / MESSAGES.length) % PHOTOS.length];
  const reaction = kind === 2 || kind === 5;
  const day = Math.floor(index / 24);

  return (
    <View style={styles.row}>
      {index % 24 === 0 && (
        <View style={styles.dateSeparator}>
          {index === 0 && <Text style={styles.serviceLabel}>iMessage</Text>}
          <Text style={styles.timestamp}>Day {day + 1} · 9:41 AM</Text>
        </View>
      )}
      <View style={[styles.message, outgoing ? styles.outgoing : styles.incoming]}>
        {reaction && (
          <View
            style={[styles.reaction, outgoing ? styles.outgoingReaction : styles.incomingReaction]}>
            <Text style={styles.reactionText}>{kind === 2 ? '♥' : '👍'}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            outgoing ? styles.blueBubble : styles.grayBubble,
            reaction && styles.reactedBubble,
            (kind === 2 || kind === 4) && styles.attachmentBubble,
            kind === 10 && styles.emojiBubble,
          ]}>
          {kind === 2 ? (
            <Image
              source={photo}
              style={styles.photo}
              accessibilityLabel="Architecture inspiration for the weekend trip"
            />
          ) : kind === 4 ? (
            <View>
              <Image
                source={photo}
                style={styles.linkPhoto}
                accessibilityLabel="Architecture guide preview"
              />
              <View style={styles.linkBody}>
                <Text style={styles.linkEyebrow}>THE WEEKEND EDIT</Text>
                <Text style={styles.linkTitle}>A day out, a different perspective</Text>
                <Text style={styles.linkDescription}>
                  Architecture, quiet streets, and a very good coffee.
                </Text>
                <Text style={styles.linkDomain}>Travel guide · Preview</Text>
              </View>
            </View>
          ) : kind === 6 ? (
            <View accessibilityLabel="Voice message preview, 18 seconds" style={styles.audio}>
              <Text style={styles.playIcon}>▶</Text>
              <View style={styles.waveform}>
                {WAVEFORM.map((height, bar) => (
                  <View key={bar} style={[styles.waveBar, { height }]} />
                ))}
              </View>
              <Text style={styles.audioDuration}>0:18</Text>
            </View>
          ) : kind === 8 ? (
            <View style={styles.file}>
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>PDF</Text>
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{MESSAGES[kind]}</Text>
                <Text style={styles.fileSize}>3 pages · 248 KB</Text>
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                outgoing && styles.whiteText,
                kind === 10 && styles.emojiText,
              ]}>
              {MESSAGES[kind]}
            </Text>
          )}
        </View>
        <Text style={[styles.messageNumber, outgoing && styles.outgoingNumber]}>
          #{(index + 1).toLocaleString()}
        </Text>
        {kind === 11 && <Text style={styles.receipt}>Read 9:42 AM</Text>}
      </View>
    </View>
  );
}

// A stable renderer prevents unrelated screen renders from refreshing every visible cell.
const renderMessage = (index: number) => <MessageRow index={index} />;

export default function SyncListScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      <SyncList
        style={styles.list}
        itemCount={ITEM_COUNT}
        estimatedItemSize={150}
        showsFPS
        renderItem={renderMessage}
      />
    </View>
  );
}

SyncListScreen.navigationOptions = { title: 'Messages' };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  list: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
    backgroundColor: '#f8f8fa',
    borderBottomColor: '#d9d9de',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#939dac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  contactName: { color: '#171719', fontSize: 15, fontWeight: '600' },
  chevron: { color: '#8e8e93', fontSize: 18 },
  subtitle: { color: '#8e8e93', fontSize: 11 },
  row: { paddingHorizontal: 14, paddingVertical: 4 },
  dateSeparator: { alignItems: 'center', gap: 4, paddingTop: 20, paddingBottom: 16 },
  serviceLabel: { fontSize: 12, color: '#8e8e93' },
  timestamp: { fontSize: 11, color: '#8e8e93', fontWeight: '600' },
  message: { maxWidth: '82%' },
  incoming: { alignSelf: 'flex-start' },
  outgoing: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 10, overflow: 'hidden' },
  grayBubble: { backgroundColor: '#e9e9eb', borderBottomLeftRadius: 6 },
  blueBubble: { backgroundColor: '#007aff', borderBottomRightRadius: 6 },
  messageText: { fontSize: 16, lineHeight: 22, color: '#171719' },
  whiteText: { color: '#ffffff' },
  attachmentBubble: { paddingHorizontal: 0, paddingVertical: 0, width: 260, maxWidth: '100%' },
  photo: { width: '100%', height: 195, resizeMode: 'cover' },
  linkPhoto: { width: '100%', height: 130, resizeMode: 'cover' },
  linkBody: { padding: 12, gap: 5 },
  linkEyebrow: { color: '#62626a', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  linkTitle: { color: '#171719', fontSize: 16, fontWeight: '600', lineHeight: 20 },
  linkDescription: { color: '#48484e', fontSize: 13, lineHeight: 18 },
  linkDomain: { color: '#76767d', fontSize: 11, marginTop: 3 },
  reactedBubble: { marginTop: 15 },
  reaction: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
    borderRadius: 18,
    backgroundColor: '#e4e4e8',
    borderWidth: 2,
    borderColor: '#ffffff',
    minWidth: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingReaction: { right: 8 },
  outgoingReaction: { left: 8 },
  reactionText: { fontSize: 18, color: '#f04d64' },
  audio: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  playIcon: { color: '#171719', fontSize: 21 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    flexShrink: 1,
    overflow: 'hidden',
  },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: '#777780' },
  audioDuration: { color: '#62626a', fontSize: 12, fontVariant: ['tabular-nums'] },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  fileIcon: {
    width: 38,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: { color: '#e35050', fontSize: 11, fontWeight: '800' },
  fileDetails: { flexShrink: 1, gap: 5 },
  fileName: { color: '#171719', fontSize: 14, fontWeight: '600' },
  fileSize: { color: '#76767d', fontSize: 12 },
  emojiBubble: { backgroundColor: 'transparent', paddingHorizontal: 0 },
  emojiText: { fontSize: 42, lineHeight: 54 },
  messageNumber: {
    color: '#8e8e93',
    fontSize: 9,
    marginTop: 3,
    marginHorizontal: 8,
    fontVariant: ['tabular-nums'],
  },
  outgoingNumber: { textAlign: 'right' },
  receipt: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 3,
    marginBottom: 8,
    marginRight: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5ea',
    backgroundColor: '#fafafa',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9e9eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#62626a', fontSize: 28, lineHeight: 30 },
  inputPreview: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 20,
    minHeight: 38,
    paddingLeft: 14,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: { color: '#8e8e93', fontSize: 16 },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#ffffff', fontSize: 24, fontWeight: '600', lineHeight: 27 },
});
