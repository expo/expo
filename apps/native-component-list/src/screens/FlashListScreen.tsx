import { FlashList } from '@shopify/flash-list';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ItemType {
  title: string;
  index: number;
}

const DATA: ItemType[] = Array(10000)
  .fill(0)
  .map((_, v) => ({ title: `Item ${v + 1}`, index: v }));

const manifest = [
  'https://raw.githubusercontent.com/EvanBacon/anime-lorem/master/assets/dr-stone/Chrome_Portrait.png',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Alumi_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Azura_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Carbo_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Chalk_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Chrome_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/En_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Ganen_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Gen_Asagiri_Portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Genbu_portrait.png?raw=true',
  'https://github.com/EvanBacon/anime-lorem/blob/master/assets/dr-stone/Ginro_Portrait.png?raw=true',
];

function Item(item: ItemType) {
  return (
    <View style={styles.itemContainer}>
      <Image style={styles.itemImage} source={{ uri: manifest[item.index % manifest.length] }} />
      <View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>Subtitle</Text>
      </View>
    </View>
  );
}

export default function FlastListScreen() {
  return (
    <FlashList data={DATA} renderItem={({ item }) => <Item {...item} />} estimatedItemSize={80} />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 8,
    flexDirection: 'row',
  },
  itemImage: {
    borderRadius: 8,
    width: 64,
    height: 64,
    marginRight: 12,
  },
  itemTitle: {
    paddingBottom: 4,
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.6,
  },
});

FlastListScreen.navigationOptions = {
  title: 'FlashList',
};
