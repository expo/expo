import { Image, ImageSource } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

const EXAMPLES = [
  {
    description: 'tintColor={null}',
    tintColor: null,
  },
  {
    description: 'tintColor="red"',
    tintColor: 'red',
  },
  {
    description: 'tintColor={Colors.tintColor}',
    tintColor: Colors.tintColor,
  },
  {
    description: 'tintColor="#0002"',
    tintColor: '#0002',
  },
];

const IMAGES: ImageSource[] = [
  require('../../../assets/images/expo.svg'),
  'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
  'https://img.icons8.com/?size=512&id=121173&format=png',
  require('../../../assets/images/pin.svg'),
];

export default function ImageTintingScreen() {
  return (
    <ScrollView style={styles.container}>
      {EXAMPLES.map((example, index) => {
        return (
          <View style={styles.example} key={index}>
            <MonoText>{example.description}</MonoText>
            <View style={styles.group}>
              {IMAGES.map((image, imageIndex) => {
                return (
                  <Image
                    style={styles.image}
                    source={image}
                    contentFit="contain"
                    tintColor={example.tintColor}
                    key={imageIndex}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  example: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  group: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  image: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
});
