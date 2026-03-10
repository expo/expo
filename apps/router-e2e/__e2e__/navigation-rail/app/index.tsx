import { Host, NavigationRail, type NavigationRailItem } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const items: NavigationRailItem[] = [
  { icon: 'filled.Home', label: 'Home' },
  { icon: 'filled.Search', label: 'Search' },
  { icon: 'filled.Favorite', label: 'Favorites', badge: '3' },
  { icon: 'filled.Settings', label: 'Settings' },
];

const contentMap: Record<number, { title: string; description: string }> = {
  0: { title: 'Home', description: 'Welcome to the NavigationRail demo.' },
  1: { title: 'Search', description: 'Search for content here.' },
  2: { title: 'Favorites', description: 'Your favorite items appear here.' },
  3: { title: 'Settings', description: 'Manage your app settings.' },
};

export default function NavigationRailScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const content = contentMap[selectedIndex];

  return (
    <View style={styles.container}>
      <Host style={styles.rail} useViewportSizeMeasurement>
        <NavigationRail
          items={items}
          selectedIndex={selectedIndex}
          onItemSelected={(e) => setSelectedIndex(e.nativeEvent.index)}
          labelVisibility="auto"
          modifiers={[fillMaxSize()]}
        />
      </Host>
      <View style={styles.content}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>
        <Text style={styles.indexLabel}>Selected index: {selectedIndex}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  rail: {
    width: 80,
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginTop: 8,
  },
  indexLabel: {
    fontSize: 14,
    marginTop: 16,
    color: '#666',
  },
});
