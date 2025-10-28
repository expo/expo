import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import Button from '../../components/Button';
import { Colors } from '../../constants';

const imageSources: string[] = [
  // HDR is currently not supported for AVIF as we're still using libavif (SDImageAVIFCoder) instead of ImageIO to decode them.
  // 'https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Tests/Tests/Images/TestHDR.avif',

  'https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Tests/Tests/Images/TestHDR.heic',
  'https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Tests/Tests/Images/TestHDR.jpeg',
  'https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Tests/Tests/Images/TestHDR.jxl',
  'https://media.githubusercontent.com/media/johncf/apple-hdr-heic/refs/heads/master/tests/data/hdr-sample.heic',
];

export default function ImageHDRScreen() {
  const [preferHighDynamicRange, setPreferHighDynamicRange] = useState(true);

  return (
    <View style={styles.container}>
      <ScrollView>
        {imageSources.map((imageSource) => {
          return (
            <Image
              key={imageSource}
              style={styles.image}
              source={imageSource}
              transition={300}
              contentFit="contain"
              cachePolicy="none"
              preferHighDynamicRange={preferHighDynamicRange}
            />
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={preferHighDynamicRange ? 'Disable HDR' : 'Enable HDR'}
          onPress={() => setPreferHighDynamicRange(!preferHighDynamicRange)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    height: 180,
    margin: 10,
  },
  footer: {
    padding: 15,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
