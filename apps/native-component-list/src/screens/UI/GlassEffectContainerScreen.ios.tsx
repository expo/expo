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
} from '@expo/ui/swift-ui-primitives';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Section } from '../../components/Page';

export default function GlassEffectContainerScreen() {
  const [spacing, setSpacing] = React.useState(40);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: 'pink' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Basic Glass Effect Container">
          <Host style={{ width: 400, height: 400 }}>
            <GlassEffectContainer
              spacing={spacing}
              observableValues={isExpanded}
              modifiers={[animation()]}>
              <HStack spacing={10}>
                <Image
                  systemName="scribble.variable"
                  size={40}
                  modifiers={[glassEffect(), glassEffectID('scribble')]}
                />
                {isExpanded ? (
                  <Image
                    systemName="eraser.fill"
                    size={40}
                    modifiers={[glassEffect(), glassEffectID('eraser')]}
                  />
                ) : null}
              </HStack>
            </GlassEffectContainer>
          </Host>
        </Section>
        <Button onPress={() => setIsExpanded(!isExpanded)}>Toggle</Button>
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
