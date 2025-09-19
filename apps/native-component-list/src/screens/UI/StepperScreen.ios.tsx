import { Host, Stepper } from '@expo/ui/swift-ui';
import { background, padding, border } from '@expo/ui/swift-ui/modifiers';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../../components/HeadingText';

const modifiers = [
  padding({ all: 16 }),
  background('#f8f9fa'),
  border({ color: '#e1e5e9', width: 1 }),
];

export default function StepperScreen() {
  const [quantity, setQuantity] = useState(1);
  const [temperature, setTemperature] = useState(20);
  const [volume, setVolume] = useState(50);
  const [speed, setSpeed] = useState(5);
  const [rating, setRating] = useState(3);
  const [items, setItems] = useState(0);

  const createStepperHandler = (
    currentValue: number,
    setValue: (value: number) => void,
    min: number,
    max: number,
    step: number,
    isIncrement: boolean
  ) => {
    return () => {
      const newValue = isIncrement ? currentValue + step : currentValue - step;
      if (newValue >= min && newValue <= max) {
        setValue(newValue);
      }
    };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={styles.heading}>Native SwiftUI Stepper Component</HeadingText>
      <Text style={styles.description}>
        Interactive stepper controls for incrementing and decrementing values
        {'\n'}Styled with SwiftUI modifiers for consistent appearance
      </Text>
      <View style={styles.section}>
        <HeadingText style={styles.sectionTitle}>Basic Steppers</HeadingText>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Items: ${quantity}`}
              value={quantity}
              onIncrement={createStepperHandler(quantity, setQuantity, 0, 50, 1, true)}
              onDecrement={createStepperHandler(quantity, setQuantity, 0, 50, 1, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Temperature: ${temperature}°C`}
              value={temperature}
              onIncrement={createStepperHandler(temperature, setTemperature, -10, 50, 5, true)}
              onDecrement={createStepperHandler(temperature, setTemperature, -10, 50, 5, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Volume: ${volume}%`}
              value={volume}
              onIncrement={createStepperHandler(volume, setVolume, 0, 100, 10, true)}
              onDecrement={createStepperHandler(volume, setVolume, 0, 100, 10, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
      </View>
      <View style={styles.section}>
        <HeadingText style={styles.sectionTitle}>Different Use Cases</HeadingText>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Speed: ${speed}/10`}
              value={speed}
              onIncrement={createStepperHandler(speed, setSpeed, 1, 10, 1, true)}
              onDecrement={createStepperHandler(speed, setSpeed, 1, 10, 1, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Rating: ${rating} stars`}
              value={rating}
              onIncrement={createStepperHandler(rating, setRating, 1, 5, 1, true)}
              onDecrement={createStepperHandler(rating, setRating, 1, 5, 1, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Cart Items: ${items} items`}
              value={items}
              onIncrement={createStepperHandler(items, setItems, 0, 20, 2, true)}
              onDecrement={createStepperHandler(items, setItems, 0, 20, 2, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
      </View>
      <View style={styles.section}>
        <HeadingText style={styles.sectionTitle}>Additional Stepper</HeadingText>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Stepper: ${quantity}`}
              value={quantity}
              onIncrement={createStepperHandler(quantity, setQuantity, 0, 50, 1, true)}
              onDecrement={createStepperHandler(quantity, setQuantity, 0, 50, 1, false)}
              modifiers={modifiers}
            />
          </Host>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  stepperContainer: {
    marginBottom: 12,
  },
});

StepperScreen.navigationOptions = {
  title: 'Stepper',
};
