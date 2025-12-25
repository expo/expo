import {
  Button,
  Progress,
  Host,
  Image,
  Label,
  List,
  Text,
  VStack,
  Section,
} from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  controlSize,
  disabled,
  fixedSize,
  foregroundStyle,
  labelStyle,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function ButtonScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="With Label">
          <Button>
            <Label
              title="Default Padding"
              systemImage="gear"
              modifiers={[
                foregroundStyle('black'),
                padding(),
                background('yellow', shapes.capsule()),
              ]}
            />
          </Button>
          <Button>
            <Label
              title="No Padding"
              systemImage="gear"
              modifiers={[foregroundStyle('black'), padding({ all: 0 }), background('yellow')]}
            />
          </Button>
          <Button>
            <Label
              title="Custom Padding"
              modifiers={[
                foregroundStyle('black'),
                padding({ horizontal: 20, vertical: 8 }),
                background('yellow'),
              ]}
            />
          </Button>
        </Section>
        <Section title="Default">
          <Button label="Test" />
        </Section>
        <Section title="System Styles">
          <Button label="Default" />
          <Button label="Glass button" modifiers={[buttonStyle('glass')]} />
          <Button label="Glass Prominent" modifiers={[buttonStyle('glassProminent')]} />
          <Button label="Bordered" modifiers={[buttonStyle('bordered')]} />
          <Button label="Borderless" modifiers={[buttonStyle('borderless')]} />
          <Button label="Bordered Prominent" modifiers={[buttonStyle('borderedProminent')]} />
          <Button label="Plain" modifiers={[buttonStyle('plain')]} />
        </Section>
        <Section title="Control Size">
          <Button
            label="Mini glass prominent"
            modifiers={[controlSize('mini'), buttonStyle('glassProminent'), fixedSize()]}
          />
          <Button
            label="Small bordered"
            modifiers={[controlSize('small'), buttonStyle('bordered')]}
          />
          <Button
            label="Regular glass"
            modifiers={[controlSize('regular'), buttonStyle('glass')]}
          />
          <Button label="Large" modifiers={[controlSize('large'), buttonStyle('glassProminent')]} />
          <Button label="Large glass" modifiers={[controlSize('large'), buttonStyle('glass')]} />
          <Button
            label="Extra Large (iOS 17+)"
            systemImage="square.and.arrow.up"
            modifiers={[controlSize('extraLarge'), buttonStyle('glassProminent'), tint('orange')]}
          />
        </Section>
        <Section title="Disabled">
          <Button label="Disabled" modifiers={[disabled()]} />
          <Button label="Enabled" />
        </Section>
        <Section title="Button Roles">
          <Button label="Default" role="default" />
          <Button label="Cancel" role="cancel" />
          <Button label="Destructive" role="destructive" />
        </Section>
        <Section title="Button Images">
          <Button label="Folder" systemImage="folder" modifiers={[buttonStyle('bordered')]} />
          <Button label="Tortoise" systemImage="tortoise" />
          <Button label="Trash" systemImage="trash" modifiers={[buttonStyle('borderless')]} />
          <Button label="Heart" systemImage="heart" />
          <Button
            label="Settings"
            systemImage="gear"
            modifiers={[buttonStyle('glass'), labelStyle('iconOnly')]}
          />
        </Section>
        <Section title="Tinted Buttons">
          <Button label="Red" modifiers={[tint('#f00f0f')]} />
        </Section>
        <Section title="Custom label">
          <Button>
            <VStack spacing={4}>
              <Image systemName="folder" />
              <Text>Folder</Text>
            </VStack>
          </Button>
          <Button>
            <Progress color="blue" variant="circular" />
          </Button>
        </Section>
      </List>
    </Host>
  );
}
