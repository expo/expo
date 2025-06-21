import { Button } from '@expo/ui/swift-ui';
import {
  Button as ButtonPrimitive,
  CircularProgress,
  Host,
  Image,
  Text,
  VStack,
} from '@expo/ui/swift-ui-primitives';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function ButtonScreen() {
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Default">
          <Button style={styles.button}>Test</Button>
        </Section>
        <Section title="System Styles">
          <Button style={styles.button} variant="default">
            Default
          </Button>
          <Button style={styles.button} variant="glass">
            Glass button
          </Button>
          <Button style={styles.button} variant="bordered">
            Bordered
          </Button>
          <Button style={styles.button} variant="borderless">
            Borderless
          </Button>
          <Button style={styles.button} variant="borderedProminent">
            Bordered Prominent
          </Button>
          <Button style={styles.button} variant="plain">
            Plain
          </Button>
        </Section>
        <Section title="Disabled">
          <Button style={styles.button} disabled>
            Disabled
          </Button>
          <Button style={styles.button}>Enabled</Button>
        </Section>
        <Section title="Button Roles">
          <Button style={styles.button} role="default">
            Default
          </Button>
          <Button style={styles.button} role="cancel">
            Cancel
          </Button>
          <Button style={styles.button} role="destructive">
            Destructive
          </Button>
        </Section>
        <Section title="Button Images">
          <Button variant="bordered" style={styles.button} systemImage="folder">
            Folder
          </Button>
          <Button style={styles.button} systemImage="tortoise">
            Tortoise
          </Button>
          <Button variant="borderless" style={styles.button} systemImage="trash">
            Trash
          </Button>
          <Button style={styles.button} systemImage="heart">
            Heart
          </Button>
        </Section>
        <Section title="Tinted Buttons">
          <Button style={styles.button} color="#f00f0f">
            Red
          </Button>
        </Section>
        <Section title="Custom children">
          <Host style={styles.buttonHost}>
            <ButtonPrimitive>
              <VStack spacing={4}>
                <Image systemName="folder" />
                <Text>Folder</Text>
              </VStack>
            </ButtonPrimitive>
          </Host>
          <Host style={styles.buttonHost}>
            <ButtonPrimitive>
              <CircularProgress color="blue" />
            </ButtonPrimitive>
          </Host>
        </Section>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    margin: 5,
    marginLeft: 20,
    overflow: 'visible',
  },
  buttonHost: {
    width: 50,
    height: 50,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
