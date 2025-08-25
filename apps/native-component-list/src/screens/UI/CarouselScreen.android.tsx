import { Carousel, CarouselItem, padding, background } from '@expo/ui/jetpack-compose';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CarouselScreen() {
  const handleItemPress = (title: string, index: number) => {
    Alert.alert('Carousel Item Pressed', `You pressed: ${title} at index: ${index}`, [
      { text: 'OK', style: 'default' },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Carousel View</Text>
      <Text style={styles.subtitle}>
        A flexible horizontal scrolling carousel with children-based API, press events, and
        modifier-based styling
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MultiBrowse Carousel (Default Properties)</Text>
        <Text style={styles.sectionDescription}>
          MultiBrowse carousel with default styling and press events.
        </Text>
        <Carousel variant="multiBrowse" style={styles.carousel}>
          <CarouselItem
            image="https://picsum.photos/id/10/400/300"
            title="Forest"
            onPress={(index: number) => handleItemPress('Forest', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/11/400/300"
            title="Lake"
            onPress={(index: number) => handleItemPress('Lake', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/15/400/300"
            title="River"
            onPress={(index: number) => handleItemPress('River', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/18/400/300"
            title="Trees"
            onPress={(index: number) => handleItemPress('Trees', index)}
          />
        </Carousel>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uncontained Carousel (Default Properties)</Text>
        <Text style={styles.sectionDescription}>
          Uncontained carousel with default styling and press events.
        </Text>
        <Carousel variant="uncontained" style={styles.carousel}>
          <CarouselItem
            image="https://picsum.photos/id/10/400/300"
            title="Forest"
            onPress={(index: number) => handleItemPress('Forest', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/11/400/300"
            title="Lake"
            onPress={(index: number) => handleItemPress('Lake', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/15/400/300"
            title="River"
            onPress={(index: number) => handleItemPress('River', index)}
          />
          <CarouselItem
            image="https://picsum.photos/id/18/400/300"
            title="Trees"
            onPress={(index: number) => handleItemPress('Trees', index)}
          />
        </Carousel>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Styling with Modifiers</Text>
        <Text style={styles.sectionDescription}>
          Carousel with custom styling using modifiers for padding and background.
        </Text>
        <Carousel
          variant="multiBrowse"
          style={styles.carousel}
          preferredItemWidth={180}
          itemSpacing={12}
          contentPadding={20}
          modifiers={[
            padding(16), // Add padding around the carousel
            background('#f8f9fa'), // Light background
          ]}>
          <CarouselItem
            image="https://picsum.photos/id/10/400/300"
            title="Custom Style 1"
            textColor="#FFFFFF"
            textStyle="titleLarge"
            cornerRadius={16}
            onPress={(index: number) =>
              Alert.alert('Custom Style 1', `You pressed item at index: ${index}`)
            }
          />
          <CarouselItem
            image="https://picsum.photos/id/11/400/300"
            title="Custom Style 2"
            textColor="#000000"
            textStyle="bodyMedium"
            cornerRadius={8}
            onPress={(index: number) =>
              Alert.alert('Custom Style 2', `You pressed item at index: ${index}`)
            }
          />
          <CarouselItem
            image="https://picsum.photos/id/15/400/300"
            title="Custom Style 3"
            textColor="#FFD700"
            textStyle="titleSmall"
            cornerRadius={50}
            onPress={(index: number) =>
              Alert.alert('Custom Style 3', `You pressed item at index: ${index}`)
            }
          />
          <CarouselItem
            image="https://picsum.photos/id/18/400/300"
            title="Custom Style 4"
            textColor="#FF6B6B"
            textStyle="bodyLarge"
            cornerRadius={0}
            onPress={(index: number) =>
              Alert.alert('Custom Style 4', `You pressed item at index: ${index}`)
            }
          />
        </Carousel>
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
    minHeight: 200,
  },
});

CarouselScreen.navigationOptions = {
  title: 'Carousel',
};
