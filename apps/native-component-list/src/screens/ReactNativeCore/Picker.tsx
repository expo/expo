import * as React from 'react';
import { Picker } from '@react-native-community/picker';

import { Page, Section } from './CommonViews';
import { Platform } from '@unimodules/core';

export function PickerExample() {
  // TODO: PickerIOS, Android `mode`, Android `prompt`, iOS `itemStyle`
  return (
    <Page>
      <Section title="Standard">
        <GenericPicker />
      </Section>
      {Platform.OS !== 'ios' && (
        <Section title="Disabled">
          <GenericPicker enabled={false} />
        </Section>
      )}
      {Platform.OS === 'web' && (
        <Section title="Larger">
          <GenericPicker style={{ height: 32, width: 128 }} />
        </Section>
      )}
    </Page>
  );
}

function GenericPicker(props: Partial<React.ComponentProps<typeof Picker>>) {
  const [value, setValue] = React.useState<any>('java');

  return (
    <Picker {...props} selectedValue={value} onValueChange={item => setValue(item)}>
      <Picker.Item label="Java" value="java" />
      <Picker.Item label="JavaScript" value="js" />
      <Picker.Item label="Objective C" value="objc" />
      <Picker.Item label="Swift" value="swift" />
    </Picker>
  );
}
