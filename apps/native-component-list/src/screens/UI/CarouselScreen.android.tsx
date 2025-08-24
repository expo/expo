import { Carousel, CarouselItem } from '@expo/ui/jetpack-compose';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

export default function CarouselScreen() {
  const items: CarouselItem[] = [
    {
      image: 'https://picsum.photos/id/10/400/300',
      title: 'Forest',
    },
    {
      image: 'https://picsum.photos/id/11/400/300',
      title: 'Lake',
    },
    {
      image: 'https://picsum.photos/id/15/400/300',
      title: 'River',
    },
    {
      image: 'https://picsum.photos/id/18/400/300',
      title: 'Trees',
    },
    {
      image: 'https://picsum.photos/id/93/400/300',
      title: 'Path',
    },
    {
      image: 'https://picsum.photos/id/110/400/300',
      title: 'Green',
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
        <Text style={styles.sectionTitle}>Multi Browse Carousel</Text>
        <Text style={styles.sectionDescription}>
          HorizontalMultiBrowseCarousel with custom styling and click events
        </Text>
        <Carousel
          style={styles.carousel}
          items={items}
          variant="multiBrowse"
          preferredItemWidth={180}
          itemHeight={160}
          itemSpacing={12}
          contentPadding={20}
          topBottomPadding={10}
          cornerRadius={24}
          textColor="#FFFFFF"
          textStyle="titleMedium"
          onItemPress={handleItemPress}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uncontained Carousel</Text>
        <Text style={styles.sectionDescription}>
          HorizontalUncontainedCarousel with no content padding (items extend beyond bounds)
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
          textColor="#FFD700"
          textStyle="titleLarge"
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
