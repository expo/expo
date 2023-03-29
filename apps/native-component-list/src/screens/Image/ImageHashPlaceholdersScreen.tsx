import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import Button from '../../components/Button';
import ComparisonRow from '../../components/HashPlaceholdersDemo/ComparisonRow';
import { comparisonImages } from '../../components/HashPlaceholdersDemo/comparisonImages';
import { Colors } from '../../constants';

export default function ImageHashPlaceholdersScreen() {
  const [showRealImage, setShowRealImage] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <Text style={styles.text}>Original</Text>
        <Text style={styles.text}>BlurHash</Text>
        <Text style={styles.text}>ThumbHash</Text>
      </View>
      <ScrollView>
        {comparisonImages.map((item) => (
          <ComparisonRow
            source={item.source}
            blurhash={item.blurhash}
            thumbhash={item.thumbhash}
            showGrid={item.showGrid}
            showRealImage={showRealImage}
          />
        ))}
      </ScrollView>
      <Button
        title="Transition"
        onPress={() => setShowRealImage(!showRealImage)}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  image: {
    width: 110,
    height: 150,
  },
  imageContainer: {
    width: 110,
    height: 150,
    margin: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    color: 'rgb(28,28,28)',
    fontSize: 15,
    textAlign: 'center',
    margin: 10,
    width: 100,
    fontWeight: '600',
  },
  button: {
    paddingTop: 15,
  },
});
