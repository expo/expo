import { Host, Label, List, Section, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function LabelScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="String title">
          <Label title="Notifications" systemImage="bell" />
          <Label title="Privacy" systemImage="lock" />
        </Section>

        <Section title="Custom icon">
          <Label title="Favorites" icon={<Text modifiers={[foregroundStyle('orange')]}>★</Text>} />
        </Section>

        <Section title="Children — custom title view">
          <Label systemImage="person.fill">
            <VStack alignment="leading" spacing={2}>
              <Text>Title</Text>
              <Text
                modifiers={[
                  font({ textStyle: 'subheadline' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}>
                Subtitle
              </Text>
            </VStack>
          </Label>
        </Section>

        <Section title="Children — icon preserves native sizing">
          <Label systemImage="bell">
            <VStack alignment="leading" spacing={2}>
              <Text>Notifications</Text>
              <Text
                modifiers={[
                  font({ textStyle: 'subheadline' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}>
                Manage your alerts
              </Text>
            </VStack>
          </Label>
          <Label systemImage="lock">
            <VStack alignment="leading" spacing={2}>
              <Text>Privacy</Text>
              <Text
                modifiers={[
                  font({ textStyle: 'subheadline' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}>
                Control your data
              </Text>
            </VStack>
          </Label>
        </Section>
      </List>
    </Host>
  );
}

LabelScreen.navigationOptions = {
  title: 'Label',
};
