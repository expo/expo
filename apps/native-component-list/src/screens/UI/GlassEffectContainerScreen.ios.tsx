import { Button } from '@expo/ui/swift-ui';
import {
  GlassEffectContainer,
  Button as ButtonPrimitive,
  Host,
  Image,
  Text,
  HStack,
  VStack,
  glassEffect,
  padding,
  offset,
  glassEffectID,
  animation,
  scaleEffect,
} from '@expo/ui/swift-ui-primitives';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Section } from '../../components/Page';

export default function GlassEffectContainerScreen() {
  const [scale, setScale] = React.useState(1);

  return (
    <View style={{ flex: 1, backgroundColor: 'pink' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Basic Glass Effect Container">
          <Host style={{ width: 400, height: 400 }}>
            <HStack modifiers={[scaleEffect(scale), animation(scale.toString())]}>
              <Image
                systemName="scribble.variable"
                size={40}
                modifiers={[glassEffect(), glassEffectID('scribble')]}
              />
            </HStack>
          </Host>
        </Section>
        <Button onPress={() => setScale(scale + 0.1)}>Toggle</Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    fontSize: 36,
  },
  smallIcon: {
    width: 40,
    height: 40,
    fontSize: 24,
  },
  customIcon: {
    width: 32,
    height: 32,
    fontSize: 20,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  controlButton: {
    minWidth: 80,
    margin: 2,
  },
  glassButton: {
    minWidth: 80,
  },
  customElement: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
