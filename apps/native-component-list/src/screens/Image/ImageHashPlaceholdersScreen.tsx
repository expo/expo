import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import Button from '../../components/Button';
import ComparisonRow from '../../components/HashPlaceholdersDemo/ComparisonRow';
import { comparisonImages } from '../../constants/ComparisonImages';

export default function ImageHashPlaceholdersScreen() {
  const [showRealImage, setShowRealImage] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <Text style={styles.text}>Original</Text>
        <Text style={styles.text}>BlurHash</Text>
        <Text style={styles.text}>ThumbHash</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {comparisonImages.map((item) => (
          <ComparisonRow
            source={item.source}
            blurhash={item.blurhash}
            thumbhash={item.thumbhash}
            showGrid={item.showGrid}
            showRealImage={showRealImage}
            key={item.blurhash + item.thumbhash}
          />
        ))}
      </ScrollView>
      <Button
        title={showRealImage ? 'Reset' : 'Transition'}
        onPress={() => setShowRealImage(!showRealImage)}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 15,
    paddingTop: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
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
    margin: 15,
  },
});
