import { Host, Label, Link, List, Section } from '@expo/ui/swift-ui';
import { background, font, foregroundStyle, padding, shapes } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function LinkScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Default">
          <Link label="Expo website" destination="https://expo.dev" />
        </Section>
        <Section title="With modifiers">
          <Link
            label="Expo website"
            destination="https://expo.dev"
            modifiers={[
              font({ weight: 'black', design: 'monospaced', size: 20 }),
              foregroundStyle('red'),
            ]}
          />
        </Section>
        <Section title="With Label">
          <Link destination="https://expo.dev">
            <Label
              title="Expo website"
              systemImage="gear"
              modifiers={[
                foregroundStyle('black'),
                padding(),
                background('yellow', shapes.capsule()),
              ]}
            />
          </Link>
          <Link destination="https://expo.dev">
            <Label
              title="No Padding"
              systemImage="gear"
              modifiers={[foregroundStyle('black'), padding({ all: 0 }), background('yellow')]}
            />
          </Link>
          <Link destination="https://expo.dev">
            <Label
              title="Custom Padding"
              modifiers={[
                foregroundStyle('black'),
                padding({ horizontal: 20, vertical: 8 }),
                background('yellow'),
              ]}
            />
          </Link>
        </Section>
      </List>
    </Host>
  );
}
