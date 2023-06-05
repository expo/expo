import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import { Colors } from '../../constants';
import ReanimatedLayoutAnimation from './ReanimatedLayoutAnimation';
import ReanimatedLightbox from './ReanimatedLightbox';
import ReanimatedSwipeable from './ReanimatedSwipeable';
import ReanimatedWobble from './ReanimatedWobble';

export default class ReanimatedScreen extends React.PureComponent {
  render() {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.exampleContainer}>
          <HeadingText style={styles.header}>Lightbox</HeadingText>
          <ReanimatedLightbox />
        </View>
        <View style={styles.exampleContainer}>
          <HeadingText style={styles.header}>Wobble</HeadingText>
          <ReanimatedWobble />
        </View>
        <View style={styles.exampleContainer}>
          <HeadingText style={styles.header}>Swipeable</HeadingText>
          <ReanimatedSwipeable />
        </View>
        <View style={styles.exampleContainer}>
          <HeadingText style={styles.header}>Layout Animation</HeadingText>
          <ReanimatedLayoutAnimation />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  exampleContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tintColor,
  },
  header: {
    paddingHorizontal: 10,
    marginBottom: 5,
  },
});
