import { Host, HStack, Image, List, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { background, clipShape, headerProminence, padding } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function SectionScreen() {
  const [collapsible, setCollapsible] = useState(false);
  const [increasedHeader, setIncreasedHeader] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <List
        listStyle={collapsible ? 'sidebar' : 'insetGrouped'}
        modifiers={[headerProminence(increasedHeader ? 'increased' : 'standard')]}>
        <Section title="Controls">
          <Toggle label="Collapsible sections" isOn={collapsible} onIsOnChange={setCollapsible} />
          <Toggle
            label="Increased header prominence"
            isOn={increasedHeader}
            onIsOnChange={setIncreasedHeader}
          />
        </Section>

        <Section title="Section with Title" collapsible={collapsible}>
          <Text>This section uses the title prop</Text>
          <Text>Simple and clean</Text>
        </Section>

        <Section
          collapsible={collapsible}
          header={
            <HStack>
              <Image systemName="star.fill" color="orange" size={16} />
              <Text>Custom Header</Text>
            </HStack>
          }
          footer={
            !collapsible ? <Text>This footer is only visible when not collapsible</Text> : undefined
          }>
          <Text>This section uses a custom header</Text>
          <Text>Footer is supported when not collapsible</Text>
        </Section>
        <Section
          header={<Text>Plain Text Header</Text>}
          footer={
            !collapsible ? (
              <Text>Plain text can also be used for headers and footers</Text>
            ) : undefined
          }>
          <Text>Simple text header example</Text>
        </Section>
      </List>
    </Host>
  );
}
