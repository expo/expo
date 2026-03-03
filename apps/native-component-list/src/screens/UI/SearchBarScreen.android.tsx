import {
  AppBarWithSearch,
  type AppBarWithSearchRef,
  Host,
  IconButton,
  Scaffold,
} from '@expo/ui/jetpack-compose';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ITEMS = [
  { name: 'Apple', subtitle: 'Sweet and crispy', id: 1 },
  { name: 'Banana', subtitle: 'Rich in potassium', id: 2 },
  { name: 'Cherry', subtitle: 'Small and tart', id: 3 },
  { name: 'Date', subtitle: 'Naturally sweet', id: 4 },
  { name: 'Elderberry', subtitle: 'Deep purple berry', id: 5 },
  { name: 'Fig', subtitle: 'Soft and jammy', id: 6 },
  { name: 'Grape', subtitle: 'Juicy clusters', id: 7 },
  { name: 'Honeydew', subtitle: 'Cool and refreshing', id: 8 },
  { name: 'Kiwi', subtitle: 'Tangy and green', id: 9 },
  { name: 'Lemon', subtitle: 'Sour and zesty', id: 10 },
  { name: 'Mango', subtitle: 'Tropical favorite', id: 11 },
  { name: 'Nectarine', subtitle: 'Smooth peach cousin', id: 12 },
  { name: 'Orange', subtitle: 'Classic citrus', id: 13 },
  { name: 'Papaya', subtitle: 'Exotic and creamy', id: 14 },
  { name: 'Raspberry', subtitle: 'Delicate and sweet', id: 15 },
  { name: 'Strawberry', subtitle: 'Summer classic', id: 16 },
  { name: 'Tangerine', subtitle: 'Easy to peel', id: 17 },
  { name: 'Watermelon', subtitle: 'Hydrating and sweet', id: 18 },
];

export default function SearchBarScreen() {
  const navigation = useNavigation();
  const searchRef = React.useRef<AppBarWithSearchRef>(null);
  const [query, setQuery] = React.useState('');

  const filteredItems = React.useMemo(() => {
    if (!query) return ITEMS;
    const lowerQuery = query.toLowerCase();
    return ITEMS.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }, [query]);

  return (
    <Host style={styles.host}>
      <Scaffold
        topBar={
          <AppBarWithSearch
            ref={searchRef}
            title="Fruit Search"
            placeholder="Search fruits..."
            defaultValue=""
            onChangeText={setQuery}
            navigationIcon={
              <IconButton systemImage="filled.ArrowBack" onPress={() => navigation.goBack()} />
            }
            trailingIcon={
              <IconButton
                systemImage="filled.MoreVert"
                onPress={() => console.log('More options')}
              />
            }>
            <ScrollView>
              {filteredItems.map((item) => (
                <Pressable
                  key={item.name}
                  style={styles.item}
                  onPress={() => {
                    console.log(item.name);
                    searchRef.current?.collapse();
                  }}>
                  <Image
                    source={{ uri: `https://picsum.photos/seed/${item.id}/100/100` }}
                    style={styles.avatar}
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
              {filteredItems.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              )}
            </ScrollView>
          </AppBarWithSearch>
        }>
        <View style={styles.content}>
          <Text style={styles.contentText}>Tap the search bar to find fruits</Text>
        </View>
      </Scaffold>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#888',
  },
});
