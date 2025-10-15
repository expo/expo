import {
  Button as ButtonPrimitive,
  CircularProgress,
  DateTimePicker,
  Host,
  HStack,
  Image,
  Switch,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  background,
  fixedSize,
  frame,
  glassEffect,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function ButtonScreen() {
  const [isPresented, setIsPresented] = React.useState(false);
  const [isPresented2, setIsPresented2] = React.useState(false);
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Popover Example">
          <Button
            onPress={() => setIsPresented(true)}
            isPresented={isPresented}
            onIsPresentedChange={(e) => setIsPresented(e.isPresented)}
            modifiers={[fixedSize()]}
            popoverView={
              <VStack
                spacing={8}
                modifiers={[frame({ width: 200, height: 150 }), padding({ all: 16 })]}>
                <Text>Popover Content</Text>
                <ButtonPrimitive onPress={() => setIsPresented(false)}>Close</ButtonPrimitive>
                <HStack spacing={8}>
                  <DateTimePicker />
                  <Switch value={isPresented} onValueChange={() => {}} modifiers={[fixedSize()]} />
                </HStack>
                <HStack spacing={8}>
                  <Button variant="glassProminent" color="red" modifiers={[fixedSize()]}>
                    Reset
                  </Button>
                  <Button modifiers={[fixedSize()]} variant="glass">
                    Save
                  </Button>
                </HStack>
              </VStack>
            }>
            <HStack spacing={8} modifiers={[frame({ height: 50 }), padding({ horizontal: 10 })]}>
              <Text>Open Popover</Text>
              <Image
                modifiers={[animation(Animation.easeInOut({ duration: 0.4 }), isPresented)]}
                systemName={isPresented ? 'gearshape' : 'gearshape.fill'}
                size={24}
              />
            </HStack>
          </Button>

          <Button
            modifiers={[fixedSize()]}
            variant="glassProminent"
            color="red"
            onPress={() => setIsPresented2(true)}
            isPresented={isPresented2}
            onIsPresentedChange={(e) => setIsPresented2(e.isPresented)}
            popoverView={
              <VStack spacing={8} modifiers={[frame({ width: 200, height: 150 })]}>
                <Text>Popover Content</Text>
                <ButtonPrimitive onPress={() => setIsPresented2(false)}>Close</ButtonPrimitive>
              </VStack>
            }>
            Simple trigger
          </Button>
        </Section>
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
          <Button style={styles.button} variant="glassProminent">
            Glass Prominent
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
        <Section title="Control Size">
          <Button
            style={styles.button}
            controlSize="mini"
            variant="glassProminent"
            modifiers={[fixedSize()]}>
            Mini glass prominent
          </Button>
          <Button style={styles.button} controlSize="small" variant="bordered">
            Small bordered
          </Button>
          <Button style={styles.button} controlSize="regular" variant="glass">
            Regular glass
          </Button>
          <Button style={styles.button} controlSize="large" variant="glassProminent">
            Large
          </Button>
          <Button style={styles.button} controlSize="large" variant="glass">
            Large glass
          </Button>
          <Button
            style={styles.button}
            controlSize="extraLarge"
            variant="glassProminent"
            systemImage="square.and.arrow.up"
            color="orange"
            modifiers={[fixedSize()]}>
            Extra Large (iOS 17+)
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
          <Button style={styles.button} systemImage="gear" variant="glass" />
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
        <Section title="interpolated strings">
          <Button style={styles.button} color="#FF6347">
            {/* eslint-disable-next-line */}
            Hello {'world'}
          </Button>
        </Section>
      </ScrollView>
    </Page>
  );
}

function Button(
  props: React.ComponentProps<typeof ButtonPrimitive> & { style?: StyleProp<ViewStyle> }
) {
  const { style, ...restProps } = props;
  return (
    <Host matchContents style={style}>
      <ButtonPrimitive {...restProps}>{props.children}</ButtonPrimitive>
    </Host>
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
