import { Host, List, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { headerProminence } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function SectionScreen() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [increasedHeader, setIncreasedHeader] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <List
        listStyle="sidebar"
        modifiers={[headerProminence(increasedHeader ? 'increased' : 'standard')]}>
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
      </List>
    </Host>
  );
}
