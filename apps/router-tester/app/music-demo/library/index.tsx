import { Image } from 'expo-image';
import { Color } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, View, Text, Pressable, useColorScheme } from 'react-native';

import { LIBRARY_SONGS as SONGS } from '../../../components/music-demo/music';

const LIBRARY_SONGS = [...SONGS, ...SONGS].map((song, i) => ({
  ...song,
  id: `${song.id}-${i}`,
}));

const LIBRARY_SECTIONS = [
  { label: 'Playlists', icon: 'music.note.list' as const },
  { label: 'Artists', icon: 'music.mic' as const },
  { label: 'Albums', icon: 'square.stack' as const },
  { label: 'Songs', icon: 'music.note' as const },
  { label: 'Downloaded', icon: 'arrow.down.circle' as const },
];

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LibraryScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {/* Library Sections */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {LIBRARY_SECTIONS.map((section, i) => (
          <Pressable
            key={section.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 13,
              borderBottomWidth: i < LIBRARY_SECTIONS.length - 1 ? 0.5 : 0,
              borderBottomColor: Color.ios.separator,
            }}>
            <SymbolView name={section.icon} size={22} tintColor={Color.ios.systemRed} />
            <Text style={{ fontSize: 17, color: isDark ? '#fff' : '#000', flex: 1 }}>
              {section.label}
            </Text>
            <SymbolView
              name="chevron.right"
              size={14}
              tintColor={Color.ios.tertiaryLabel}
              weight="semibold"
            />
          </Pressable>
        ))}
      </View>

      {/* Recently Added */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: isDark ? '#fff' : '#000',
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 8,
        }}>
        Recently Added
      </Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        {LIBRARY_SONGS.map((song, i) => (
          <View
            key={song.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 8,
              borderBottomWidth: i < LIBRARY_SONGS.length - 1 ? 0.5 : 0,
              borderBottomColor: Color.ios.separator,
            }}>
            <Image
              source={{ uri: song.artwork }}
              style={{ width: 48, height: 48, borderRadius: 6 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: isDark ? '#fff' : '#000' }} numberOfLines={1}>
                {song.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Color.ios.secondaryLabel,
                }}
                numberOfLines={1}>
                {song.artist} — {song.album}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: Color.ios.tertiaryLabel }}>
              {formatDuration(song.duration)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
