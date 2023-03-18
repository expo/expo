import { Image } from 'expo-image';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';

const WINDOW_DIMENSIONS = Dimensions.get('window');
const IMAGE_MARGIN = 15;
const IMAGE_WIDTH = (WINDOW_DIMENSIONS.width - 2 * IMAGE_MARGIN) * WINDOW_DIMENSIONS.scale;

export default function ImageBlurhashScreen() {
  const [enabled, setEnabled] = React.useState(true);
  const toggleLiveTextInteraction = React.useCallback(() => {
    setEnabled(!enabled);
  }, [enabled]);

  return (
    <View style={styles.container}>
      <Text style={styles.supportText}>
        Live Text interaction is not supported on the simulator!
      </Text>

      <Button
        style={styles.toggleButton}
        title={`${enabled ? 'Disable' : 'Enable'} Live Text Interaction`}
        onPress={toggleLiveTextInteraction}
      />

      <ScrollView>
        <Image
          style={styles.image}
          source={`https://images.unsplash.com/photo-1554290712-e640351074bd?w=${IMAGE_WIDTH}`}
          contentFit="contain"
          cachePolicy="none"
          enableLiveTextInteraction={enabled}
        />
        <Image
          style={styles.image}
          source={`https://images.unsplash.com/photo-1562164979-6fc780665354?w=${IMAGE_WIDTH}`}
          contentFit="contain"
          cachePolicy="none"
          enableLiveTextInteraction={enabled}
        />
        <Image
          style={styles.image}
          source={`https://images.unsplash.com/photo-1605206731612-e7dc29d3209a?w=${IMAGE_WIDTH}`}
          contentFit="contain"
          cachePolicy="none"
          enableLiveTextInteraction={enabled}
        />
        <Image
          style={styles.image}
          source={`https://images.unsplash.com/photo-1601435119596-7cc938a5cbf4?w=${IMAGE_WIDTH}`}
          contentFit="contain"
          cachePolicy="none"
          enableLiveTextInteraction={enabled}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  supportText: {
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 15,
  },
  toggleButton: {
    margin: 15,
  },
  image: {
    flex: 1,
    height: 250,
    margin: IMAGE_MARGIN,
  },
});
