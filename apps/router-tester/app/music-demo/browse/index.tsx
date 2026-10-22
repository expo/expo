import { Image } from 'expo-image';
import { Color } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, View, Text, useColorScheme, useWindowDimensions } from 'react-native';

import { BROWSE_CATEGORIES, TOP_PICKS } from '../../../components/music-demo/music';

export default function BrowseScreen() {
  const isDark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {/* Categories */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 }}>
        {BROWSE_CATEGORIES.map((cat) => (
          <View
            key={cat.id}
            style={{
              width: cardWidth,
              height: 56,
              backgroundColor: cat.color,
              borderRadius: 10,
              borderCurve: 'continuous',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
            }}>
            <SymbolView name={cat.icon} size={20} tintColor="#fff" />
            <Text
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: '600',
                flex: 1,
              }}
              numberOfLines={1}>
              {cat.name}
            </Text>
          </View>
        ))}
      </View>

      {/* New Music */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: isDark ? '#fff' : '#000',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}>
        New Music
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 14,
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}>
        {TOP_PICKS.map((album) => (
          <View key={album.id} style={{ width: 170 }}>
            <Image
              source={{ uri: album.artwork }}
              style={{ width: 170, height: 170, borderRadius: 10 }}
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
            <Text
              style={{
                fontSize: 12,
                color: Color.ios.secondaryLabel,
              }}
              numberOfLines={1}>
              {album.artist}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
