import {
  Button,
  CircularProgress,
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
  fixedSize,
  foregroundStyle,
  padding,
  shapes,
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
          <Button>Test</Button>
        </Section>
        <Section title="System Styles">
          <Button variant="default">Default</Button>
          <Button variant="glass">Glass button</Button>
          <Button variant="glassProminent">Glass Prominent</Button>
          <Button variant="bordered">Bordered</Button>
          <Button variant="borderless">Borderless</Button>
          <Button variant="borderedProminent">Bordered Prominent</Button>
          <Button variant="plain">Plain</Button>
        </Section>
        <Section title="Control Size">
          <Button controlSize="mini" variant="glassProminent" modifiers={[fixedSize()]}>
            Mini glass prominent
          </Button>
          <Button controlSize="small" variant="bordered">
            Small bordered
          </Button>
          <Button controlSize="regular" variant="glass">
            Regular glass
          </Button>
          <Button controlSize="large" variant="glassProminent">
            Large
          </Button>
          <Button controlSize="large" variant="glass">
            Large glass
          </Button>
          <Button
            controlSize="extraLarge"
            variant="glassProminent"
            systemImage="square.and.arrow.up"
            color="orange">
            Extra Large (iOS 17+)
          </Button>
        </Section>
        <Section title="Disabled">
          <Button disabled>Disabled</Button>
          <Button>Enabled</Button>
        </Section>
        <Section title="Button Roles">
          <Button role="default">Default</Button>
          <Button role="cancel">Cancel</Button>
          <Button role="destructive">Destructive</Button>
        </Section>
        <Section title="Button Images">
          <Button variant="bordered" systemImage="folder">
            Folder
          </Button>
          <Button systemImage="tortoise">Tortoise</Button>
          <Button variant="borderless" systemImage="trash">
            Trash
          </Button>
          <Button systemImage="heart">Heart</Button>
          <Button systemImage="gear" variant="glass" />
        </Section>
        <Section title="Tinted Buttons">
          <Button color="#f00f0f">Red</Button>
        </Section>
        <Section title="Custom children">
          <Button>
            <VStack spacing={4}>
              <Image systemName="folder" />
              <Text>Folder</Text>
            </VStack>
          </Button>
          <Button>
            <CircularProgress color="blue" />
          </Button>
        </Section>
        <Section title="interpolated strings">
          <Button color="#FF6347">
            {/* eslint-disable-next-line */}
            Hello {'world'}
          </Button>
        </Section>
      </List>
    </Host>
  );
}
