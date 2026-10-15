import { Host, List, Section, Text } from '@expo/ui/swift-ui';

import { SafeAreaEdgeGuides } from '../../../components/SafeAreaEdgeGuides';

export default function ListScreen() {
  return (
    <SafeAreaEdgeGuides>
      <Host style={{ flex: 1 }}>
        <List>
          <Section title="Section">
            <Text>
              Beside the iPhone Duo rail, this card should start on the dashed line, with the large
              title.
            </Text>
            <Text>Second row</Text>
          </Section>
        </List>
      </Host>
    </SafeAreaEdgeGuides>
  );
}
