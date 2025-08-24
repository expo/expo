import { Carousel, CarouselItem } from '@expo/ui/jetpack-compose';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

export default function CarouselScreen() {
  const items: CarouselItem[] = [
    {
      image: 'https://picsum.photos/300/200?random=1',
      title: 'Featured Item 1',
    },
    {
      image: 'https://picsum.photos/300/200?random=2',
      title: 'Featured Item 2',
    },
    {
      image: 'https://picsum.photos/300/200?random=3',
      title: 'Featured Item 3',
    },
    {
      image: 'https://picsum.photos/300/200?random=4',
      title: 'Featured Item 4',
    },
    {
      image: 'https://picsum.photos/300/200?random=5',
      title: 'Featured Item 5',
    },
    {
      image: 'https://picsum.photos/300/200?random=6',
      title: 'Featured Item 6',
    },
  ];

  const handleItemPress = (event: { nativeEvent: { index: number } }) => {
    const currentIndex = event.nativeEvent.index;
    Alert.alert(
      'Item Pressed',
      `You pressed item at index: ${currentIndex}\nTitle: ${items[currentIndex]?.title || 'Unknown'}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Carousel View</Text>
      <Text style={styles.subtitle}>A simple horizontal scrolling carousel component</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi Browse Carousel (Large Items)</Text>
        <Text style={styles.sectionDescription}>
          HorizontalMultiBrowseCarousel with large items (200dp width, default spacing)
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={200}
          itemHeight={200}
          itemSpacing={8}
          contentPadding={16}
          topBottomPadding={8}
          cornerRadius={28}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi Browse Carousel (Compact Layout)</Text>
        <Text style={styles.sectionDescription}>
          HorizontalMultiBrowseCarousel with compact spacing (160dp width, 4dp spacing, 8dp padding)
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={160}
          itemHeight={200}
          itemSpacing={4}
          contentPadding={8}
          topBottomPadding={4}
          cornerRadius={16}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi Browse Carousel (Small Items)</Text>
        <Text style={styles.sectionDescription}>
          HorizontalMultiBrowseCarousel with small items (120dp width, 150dp height, rounded
          corners)
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={120}
          itemHeight={150}
          itemSpacing={8}
          contentPadding={16}
          topBottomPadding={8}
          cornerRadius={12}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi Browse Carousel (Spacious Layout)</Text>
        <Text style={styles.sectionDescription}>
          HorizontalMultiBrowseCarousel with spacious layout (200dp width, 300dp height, 16dp
          spacing)
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={200}
          itemHeight={300}
          itemSpacing={16}
          contentPadding={24}
          topBottomPadding={16}
          cornerRadius={32}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uncontained Carousel</Text>
        <Text style={styles.sectionDescription}>
          HorizontalUncontainedCarousel variant with no content padding (items extend beyond bounds)
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="uncontained"
          preferredItemWidth={200}
          itemHeight={200}
          itemSpacing={8}
          topBottomPadding={8}
          cornerRadius={28}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carousel with Custom Text Styling</Text>
        <Text style={styles.sectionDescription}>
          Multi Browse carousel with custom gold titleLarge text
        </Text>
        <Carousel
          style={styles.carousel}
          items={items.slice(0, 3)}
          variant="multiBrowse"
          preferredItemWidth={200}
          itemHeight={200}
          itemSpacing={8}
          contentPadding={16}
          topBottomPadding={8}
          cornerRadius={28}
          initialItemIndex={2}
          textColor="#FFD700"
          textStyle="titleLarge"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clickable Carousel</Text>
        <Text style={styles.sectionDescription}>
          Multi Browse carousel with clickable items - tap any item to see the alert
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={160}
          itemHeight={180}
          itemSpacing={8}
          contentPadding={16}
          topBottomPadding={8}
          cornerRadius={20}
          textColor="#FFFFFF"
          textStyle="titleMedium"
          onItemPress={handleItemPress}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  carousel: {
    width: '100%',
    height: 200,
  },
});

CarouselScreen.navigationOptions = {
  title: 'Carousel',
};
