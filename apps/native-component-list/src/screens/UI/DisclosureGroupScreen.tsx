import { DisclosureGroup } from '@expo/ui/components/DisclosureGroup';
import { Section } from '@expo/ui/components/Section';
import * as React from 'react';
import {  Text } from 'react-native';

export default function DisclosureGroupScreen() {
  return (
    <>
<Section title=''>
    <DisclosureGroup title='Click me!' style={{flex: 1}}>
      <Text>Hello, how are you?</Text>
      </DisclosureGroup>
  </Section>


</>
  );
}

DisclosureGroupScreen.navigationOptions = {
  title: 'DisclosureGroup',
};
