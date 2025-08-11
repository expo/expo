import { Button } from '@expo/ui/swift-ui';
import {
  GlassEffectContainer,
  Button as ButtonPrimitive,
  Host,
  Image,
  Text,
  HStack,
  VStack,
} from '@expo/ui/swift-ui-primitives';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function GlassEffectContainerScreen() {
  const [spacing, setSpacing] = React.useState(40);

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Basic Glass Effect Container">
          <Host matchContents>
            <GlassEffectContainer spacing={spacing}>
              <HStack spacing={40}>
                <Image systemName="scribble.variable" />
                <Image systemName="eraser.fill" />
              </HStack>
            </GlassEffectContainer>
          </Host>
        </Section>

        <Section title="Interactive Spacing Control">
          <View style={styles.controls}>
            <Button onPress={() => setSpacing(0)}>No Spacing</Button>
            <Button onPress={() => setSpacing(20)}>Small</Button>
            <Button onPress={() => setSpacing(40)}>Medium</Button>
            <Button onPress={() => setSpacing(80)}>Large</Button>
          </View>
        </Section>

        {/* <Section title="Multiple Glass Elements">
          <Host matchContents>
            <GlassEffectContainer spacing={20}>
              <VStack spacing={20}>
                <HStack spacing={20}>
                  <Image systemName="heart.fill" />
                  <Image systemName="star.fill" />
                  <Image systemName="bookmark.fill" />
                </HStack>
                <HStack spacing={20}>
                  <Image systemName="folder.fill" />
                  <Image systemName="trash.fill" />
                  <Image systemName="gear" />
                </HStack>
              </VStack>
            </GlassEffectContainer>
          </Host>
        </Section>

        <Section title="Glass Buttons in Container">
          <Host matchContents>
            <GlassEffectContainer spacing={30}>
              <HStack spacing={30}>
                <Button variant="glass" style={styles.glassButton} systemImage="play.fill">
                  Play
                </Button>
                <Button variant="glass" style={styles.glassButton} systemImage="pause.fill">
                  Pause
                </Button>
                <Button variant="glass" style={styles.glassButton} systemImage="stop.fill">
                  Stop
                </Button>
              </HStack>
            </GlassEffectContainer>
          </Host>
        </Section>

        <Section title="Custom Glass Elements">
          <Host matchContents>
            <GlassEffectContainer spacing={25}>
              <HStack spacing={25}>
                <ButtonPrimitive>
                  <VStack spacing={8}>
                    <Image systemName="cloud.fill" />
                    <Text>Weather</Text>
                  </VStack>
                </ButtonPrimitive>
                <ButtonPrimitive>
                  <VStack spacing={8}>
                    <Image systemName="message.fill" />
                    <Text>Messages</Text>
                  </VStack>
                </ButtonPrimitive>
              </HStack>
            </GlassEffectContainer>
          </Host>
        </Section> */}
      </ScrollView>
    </Page>
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
