import { Host, List, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { headerProminence, listStyle } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function SectionScreen() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [increasedHeader, setIncreasedHeader] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <List
        modifiers={[
          listStyle('sidebar'),
          headerProminence(increasedHeader ? 'increased' : 'standard'),
        ]}>
        <Section title="Controls">
          <Toggle
            label="Increased header prominence"
            isOn={increasedHeader}
            onIsOnChange={setIncreasedHeader}
          />
        </Section>
        <Section
          title="Section with Title"
          isExpanded={isExpanded}
          onIsExpandedChange={setIsExpanded}>
          <Text>This section uses the title prop</Text>
          <Text>Simple and clean</Text>
        </Section>
        <Section title="Title with Footer" footer={<Text>This footer should be visible</Text>}>
          <Text>This section has both a title and a footer</Text>
        </Section>
        <Section
          header={<Text>Header with Footer</Text>}
          footer={<Text>Footer with custom header</Text>}>
          <Text>This section uses header and footer props</Text>
        </Section>
        <Section footer={<Text>Footer without header</Text>}>
          <Text>This section only has a footer</Text>
        </Section>
      </List>
    </Host>
  );
}
