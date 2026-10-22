import { ScrollView, View, Text, useWindowDimensions } from 'react-native';

import { SEARCH_CATEGORIES } from '../../../components/music-demo/music';

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#8E8E93',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
        Browse Categories
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 120,
        }}>
        {SEARCH_CATEGORIES.map((cat) => (
          <View
            key={cat.id}
            style={{
              width: cardWidth,
              height: 110,
              backgroundColor: cat.color,
              borderRadius: 10,
              borderCurve: 'continuous',
              justifyContent: 'flex-end',
              padding: 14,
            }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
