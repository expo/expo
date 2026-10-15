import { Form, Host, Section, Text } from '@expo/ui/swift-ui';

import { SafeAreaEdgeGuides } from '../../../components/SafeAreaEdgeGuides';

export default function FormScreen() {
  return (
    <SafeAreaEdgeGuides>
      <Host style={{ flex: 1 }}>
        <Form>
          <Section title="Section">
            <Text>
              Beside the iPhone Duo rail, this card should start on the dashed line, with the large
              title.
            </Text>
            <Text>Second row</Text>
          </Section>
        </Form>
      </Host>
    </SafeAreaEdgeGuides>
  );
}
