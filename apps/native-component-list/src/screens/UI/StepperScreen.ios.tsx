import { Host, Stepper, Switch } from '@expo/ui/swift-ui';
import { background, padding, border } from '@expo/ui/swift-ui/modifiers';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

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
  const [enabled, setEnabled] = useState(false);

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
              defaultValue={quantity}
              min={0}
              max={50}
              step={1}
              onValueChange={setQuantity}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Temperature: ${temperature}°C`}
              defaultValue={temperature}
              min={-10}
              max={50}
              step={5}
              onValueChange={setTemperature}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Volume: ${volume}%`}
              defaultValue={volume}
              min={0}
              max={100}
              step={10}
              onValueChange={setVolume}
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
              defaultValue={speed}
              min={1}
              max={10}
              step={1}
              onValueChange={setSpeed}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Rating: ${rating} stars`}
              defaultValue={rating}
              min={1}
              max={5}
              step={1}
              onValueChange={setRating}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Cart Items: ${items} items`}
              defaultValue={items}
              min={0}
              max={20}
              step={2}
              onValueChange={setItems}
              modifiers={modifiers}
            />
          </Host>
        </View>
      </View>

      <View style={styles.section}>
        <HeadingText style={styles.sectionTitle}>Disabled State</HeadingText>
        <View style={styles.stepperContainer}>
          <Host matchContents>
            <Stepper
              label={`Disabled Stepper: ${quantity}`}
              defaultValue={quantity}
              min={0}
              max={50}
              step={1}
              disabled={!enabled}
              onValueChange={setQuantity}
              modifiers={modifiers}
            />
          </Host>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Toggle Disabled State:</Text>
          <Host matchContents>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              label={enabled ? 'Enabled' : 'Disabled'}
              variant="switch"
              modifiers={modifiers}
            />
          </Host>
        </View>
      </View>
      <View style={styles.section}>
        <HeadingText style={styles.sectionTitle}>Current Values</HeadingText>
        <View style={styles.valuesContainer}>
          <MonoText textStyle={styles.valuesText}>
            Quantity: {quantity} | Temperature: {temperature}°C | Volume: {volume}%{'\n'}Speed:{' '}
            {speed}/10 | Rating: {rating} stars | Items: {items}
          </MonoText>
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
  toggleContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  valuesContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  valuesText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});

StepperScreen.navigationOptions = {
  title: 'Stepper',
};
