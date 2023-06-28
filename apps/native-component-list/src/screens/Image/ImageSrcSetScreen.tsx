import { Image, ImageSource } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '../../constants';

export default function ImageSrcSetScreen() {
  const source: ImageSource[] = [
    {
      uri: `https://picsum.photos/id/238/800/800`,
      width: 800,
      height: 800,
      webMaxViewportWidth: 800,
    },
    {
      uri: `https://picsum.photos/id/237/1200/1200`,
      width: 1200,
      height: 1200,
      webMaxViewportWidth: 1200,
    },
    {
      uri: `https://picsum.photos/id/236/600/600`,
      width: 600,
      height: 600,
      webMaxViewportWidth: 600,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.hintText}>
        This image is using the srcSet prop to load different images depending on the viewport
        width.
      </Text>
      <Image style={styles.image} source={source} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hintText: {
    color: Colors.secondaryText,
    margin: 15,
  },
  image: {
    width: 300,
    margin: 15,
    height: 300,
  },
});
