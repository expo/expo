import { Image } from 'expo-image';
import { Color, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, View, Text, useWindowDimensions, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LIBRARY_SONGS, LYRICS } from '../../../components/music-demo/music';

const SIDE_BY_SIDE_MIN_WIDTH = 800;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: Color.ios.systemFill }}>
      <View
        style={{
          width: `${progress * 100}%`,
          height: 4,
          borderRadius: 2,
          backgroundColor: Color.ios.secondaryLabel,
        }}
      />
    </View>
  );
}

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = LIBRARY_SONGS.find((s) => s.id === id) ?? LIBRARY_SONGS[0];
  const { width } = useWindowDimensions();
  const isSideBySide = width > SIDE_BY_SIDE_MIN_WIDTH;
  const fg = useColorScheme() === 'dark' ? '#fff' : '#000';
  const elapsed = Math.floor(song.duration / 3);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: song.title }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.and.arrow.up" />
        <Stack.Toolbar.Button icon="ellipsis" />
      </Stack.Toolbar>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexDirection: isSideBySide ? 'row' : 'column',
          gap: 32,
          padding: 24,
          paddingBottom: 120,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
          width,
          overflowX: 'hidden',
        }}>
        <View style={{ flex: isSideBySide ? 1 : undefined, gap: 20 }}>
          <Image
            source={{ uri: song.artwork }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
          />
          <View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: fg }} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={{ fontSize: 17, color: Color.ios.secondaryLabel }} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
          <View style={{ gap: 6 }}>
            <ProgressBar progress={elapsed / song.duration} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: Color.ios.secondaryLabel }}>
                {formatDuration(elapsed)}
              </Text>
              <Text style={{ fontSize: 12, color: Color.ios.secondaryLabel }}>
                -{formatDuration(song.duration - elapsed)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <SymbolView name="backward.fill" size={32} tintColor={fg} />
            <SymbolView name="pause.fill" size={40} tintColor={fg} />
            <SymbolView name="forward.fill" size={32} tintColor={fg} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SymbolView name="speaker.fill" size={14} tintColor={Color.ios.secondaryLabel} />
            <View style={{ flex: 1 }}>
              <ProgressBar progress={0.6} />
            </View>
            <SymbolView name="speaker.wave.3.fill" size={14} tintColor={Color.ios.secondaryLabel} />
          </View>
        </View>
        <Text
          style={{
            flex: isSideBySide ? 1 : undefined,
            fontSize: 28,
            fontWeight: '700',
            lineHeight: 38,
            color: fg,
          }}>
          {LYRICS}
        </Text>
      </ScrollView>
    </>
  );
}
