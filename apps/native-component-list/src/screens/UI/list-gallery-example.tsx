import { Host, List, RNHostView, VStack } from '@expo/ui/swift-ui';
import { listRowInsets, listRowSeparator, listStyle } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from 'ThemeProvider';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sources = [
  require('../../../assets/images/example1.jpg'),
  require('../../../assets/images/example2.jpg'),
  require('../../../assets/images/example3.jpg'),
  require('../../../assets/images/example4.webp'),
];

// Group once: the List virtualizes horizontal rows, each containing three photos.
// Repeat bundled assets to exercise scrolling without introducing network variability.
const rows = Array.from({ length: 100 }, (_, row) => ({
  id: `photo-row-${row}`,
  photos: Array.from({ length: 3 }, (_, column) => {
    const index = row * 3 + column;
    return {
      id: `photo-${index}`,
      source: sources[index % sources.length],
      label: `Photo ${index + 1}`,
    };
  }),
}));
const keyExtractor = (row: (typeof rows)[number]) => row.id;
const gap = 4;
const inset = 12;
const rowModifiers = [
  listRowInsets({ top: 2, bottom: 2, leading: inset, trailing: inset }),
  listRowSeparator('hidden'),
];

export default function ListGalleryExample() {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const rowWidth = Math.max(0, width - inset * 2);
  const photoSize = Math.max(0, (rowWidth - gap * 2) / 3);
  const renderItem = useCallback(
    (item: (typeof rows)[number]) => (
      <VStack spacing={0}>
        <RNHostView matchContents>
          {/* Explicit width lets matchContents measure the RN row without an unbounded proposal. */}
          <View style={{ width: rowWidth, flexDirection: 'row', gap }}>
            {item.photos.map((photo) => (
              <Image
                key={photo.id}
                source={photo.source}
                accessibilityLabel={photo.label}
                contentFit="cover"
                recyclingKey={photo.id}
                style={{
                  width: photoSize,
                  height: photoSize,
                  borderRadius: 4,
                  backgroundColor: theme.background.element,
                }}
              />
            ))}
          </View>
        </RNHostView>
      </VStack>
    ),
    [rowWidth, photoSize, theme.background.element]
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 6 }}>
        <Text style={{ color: theme.text.default, fontSize: 15, fontWeight: '600' }}>
          Photo gallery
        </Text>
        <Text style={{ color: theme.text.secondary, fontSize: 13, lineHeight: 18 }}>
          300 tiles · 3 per row · 4 bundled photos repeated
        </Text>
      </View>
      <View style={{ flex: 1 }} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
        {photoSize > 0 && (
          <Host style={{ flex: 1 }}>
            <List modifiers={[listStyle('plain')]}>
              <List.ForEach
                data={rows}
                keyExtractor={keyExtractor}
                estimatedRowHeight={photoSize}
                modifiers={rowModifiers}>
                {renderItem}
              </List.ForEach>
            </List>
          </Host>
        )}
      </View>
    </SafeAreaView>
  );
}
