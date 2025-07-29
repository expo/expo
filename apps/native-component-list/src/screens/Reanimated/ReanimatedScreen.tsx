import { ScrollView, StyleSheet, View } from 'react-native';

import { AccordionExample } from './ReanimatedAccordion';
import { FlipCardExample } from './ReanimatedFlipCard';
import { SliderExample } from './ReanimatedSlider';
import HeadingText from '../../components/HeadingText';
import { Colors } from '../../constants';

export default function ReanimatedScreen() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.exampleContainer}>
        <HeadingText style={styles.header}>Flip Card</HeadingText>
        <FlipCardExample />
      </View>
      <View style={styles.exampleContainer}>
        <HeadingText style={styles.header}>Slider</HeadingText>
        <SliderExample />
      </View>
      <View style={styles.exampleContainer}>
        <HeadingText style={styles.header}>Accordion</HeadingText>
        <AccordionExample />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  exampleContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tintColor,
  },
  header: {
    paddingHorizontal: 10,
    marginBottom: 5,
  },
});
