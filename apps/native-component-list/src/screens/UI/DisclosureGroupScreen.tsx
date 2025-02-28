import { DisclosureGroup } from '@expo/ui/components/DisclosureGroup';
import { Section } from '@expo/ui/components/Section';
import * as React from 'react';
import { Text } from 'react-native';
import {Button} from '@expo/ui/components/Button';

export default function DisclosureGroupScreen() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
   <>
      <Button onPress={()=> setIsExpanded(!isExpanded)}>Toggle DisclosureGroup</Button>
      <DisclosureGroup isExpanded={false} onStateChange={(e)=> alert(e)} title='Click me!' style={{ flex: 1 }}>
        <Text>Hello, how are you?</Text>
      </DisclosureGroup>
    </>
  );
}

DisclosureGroupScreen.navigationOptions = {
  title: 'DisclosureGroup',
};
