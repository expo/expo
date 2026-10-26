import { Image } from 'expo-image';
import { Color } from 'expo-router';
import { ScrollView, View, Text, useWindowDimensions, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FEATURED_ALBUM, RECENTLY_PLAYED, TOP_PICKS } from '../../../components/music-demo/music';

function SectionHeader({ title }: { title: string }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Text
      style={{
        fontSize: 22,
        fontWeight: '700',
        color: isDark ? '#fff' : '#000',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
      }}>
      {title}
    </Text>
  );
}

function AlbumCard({ album, size }: { album: (typeof RECENTLY_PLAYED)[0]; size: number }) {
  return (
    <View style={{ width: size }}>
      <Image
        source={{ uri: album.artwork }}
        style={{ width: size, height: size, borderRadius: 10 }}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: Color.ios.label,
          marginTop: 6,
        }}
        numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={{ fontSize: 12, color: Color.ios.secondaryLabel }} numberOfLines={1}>
        {album.artist}
      </Text>
    </View>
  );
}

export default function ListenNowScreen() {
  const insets = useSafeAreaInsets();
  const width = useWindowDimensions().width - insets.left - insets.right;
  const isDark = useColorScheme() === 'dark';
  const albumSize = 170;
  console.log(width);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      {/* Featured Album */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: Color.ios.secondaryLabel,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Featured Album
        </Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#fff' : '#000',
            marginTop: 2,
          }}>
          {FEATURED_ALBUM.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: Color.ios.secondaryLabel,
            marginBottom: 12,
          }}>
          {FEATURED_ALBUM.artist}
        </Text>
        <Image
          source={{ uri: FEATURED_ALBUM.artwork }}
          style={{
            width: width - 32,
            height: (width - 32) * 0.55,
            borderRadius: 14,
          }}
        />
      </View>

      {/* Recently Played */}
      <SectionHeader title="Recently Played" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
        {RECENTLY_PLAYED.map((album) => (
          <AlbumCard key={album.id} album={album} size={albumSize} />
        ))}
      </ScrollView>

      {/* Top Picks */}
      <SectionHeader title="Top Picks for You" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 14,
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}>
        {TOP_PICKS.map((album) => (
          <AlbumCard key={album.id} album={album} size={albumSize} />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
