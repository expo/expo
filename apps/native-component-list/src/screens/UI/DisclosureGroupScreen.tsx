import { DisclosureGroup } from '@expo/ui/components/DisclosureGroup';
import * as React from 'react';
import { Text } from 'react-native';

export default function DisclosureGroupScreen() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
    <DisclosureGroup
      isExpanded={isExpanded}
      onStateChange={(e) => setIsExpanded(e)}
      title="Click me!"
      style={{ flex: 1 }}>
      <Text>Hello, how are you?</Text>
    </DisclosureGroup>
  );
}

DisclosureGroupScreen.navigationOptions = {
  title: 'DisclosureGroup',
};
