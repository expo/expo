import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  title1: {
    fontSize: 48,
    fontWeight: '300',
  },
  title2: {
    fontSize: 48,
    fontWeight: '600',
  },
  description: {
    opacity: 0.5,
    fontSize: 16,
  },
});

interface ContentProps {
  color: string;
  backgroundColor: string;
  source: number;
  title1: string;
  title2: string;
}

export default ({ color, backgroundColor, source, title1, title2 }: ContentProps) => {
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        padding: 32,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
      <Image {...{ source }} />
      <View>
        <Text style={[styles.title1, { color }]}>{title1}</Text>
        <Text style={[styles.title2, { color }]}>{title2}</Text>
        <Text style={[styles.description, { color }]}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec rutrum pharetra
          pellentesque. Donec blandit purus ut arcu vulputate, at rutrum sem dictum. Mauris sagittis
          felis interdum arcu ultrices vestibulum.
        </Text>
      </View>
    </View>
  );
};
