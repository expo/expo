import { Picker, type PickerProps, type PickerRef } from '@expo/ui/community/picker';
import React, { useRef, useState } from 'react';
import { Button, Platform, Text } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

const monospace = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const sansSerif = Platform.select({
  ios: 'Helvetica',
  android: 'sansSerif',
  default: 'sansSerif',
});
const cursive = Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' });

export default function CommunityPickerScreen() {
  return (
    <ScrollPage>
      <Section title="Standard">
        <GenericPicker />
      </Section>

      <Section title="Styled (backgroundColor, borderRadius)">
        <GenericPicker style={{ backgroundColor: '#e0e7ff', borderRadius: 12 }} />
      </Section>

      <Section title="Per-item styling and state">
        <StyledPicker />
      </Section>

      <Section title="Imperative focus and blur (Android)">
        <RefPicker />
      </Section>

      <Section title="Disabled">
        <GenericPicker enabled={false} />
      </Section>
    </ScrollPage>
  );
}

CommunityPickerScreen.navigationOptions = {
  title: 'Community Picker',
};

function StyledPicker() {
  const [value, setValue] = useState<string>('java');

  return (
    <>
      <Picker selectedValue={value} onValueChange={(itemValue) => setValue(itemValue)}>
        <Picker.Item
          label="Java"
          value="java"
          style={{
            color: '#e11d48',
            fontFamily: monospace,
            fontSize: 14,
            backgroundColor: 'black',
          }}
        />
        <Picker.Item
          label="JavaScript"
          value="js"
          style={{ color: '#2563eb', fontFamily: serif, fontSize: 33 }}
          enabled={false}
        />
        <Picker.Item
          label="Objective C"
          value="objc"
          style={{ color: '#059669', fontFamily: sansSerif, fontSize: 16 }}
        />
        <Picker.Item
          label="Swift"
          value="swift"
          style={{ color: '#d97706', fontFamily: cursive, fontSize: 30 }}
          enabled={false}
        />
      </Picker>
      <Text>Selected: {value}</Text>
    </>
  );
}

function RefPicker() {
  const [value, setValue] = useState<string>('java');
  const pickerRef = useRef<PickerRef>(null);

  return (
    <>
      <Button
        title="Imperative focus and blur with a delay"
        onPress={() => {
          pickerRef.current?.focus();
          setTimeout(() => {
            pickerRef.current?.blur();
          }, 2000);
        }}
      />
      <Picker ref={pickerRef} selectedValue={value} onValueChange={setValue}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" />
      </Picker>
      <Text>Selected: {value}</Text>
    </>
  );
}

function GenericPicker(props: Partial<PickerProps>) {
  const [value, setValue] = useState<string>('java');

  return (
    <>
      <Picker {...props} selectedValue={value} onValueChange={(itemValue) => setValue(itemValue)}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" />
      </Picker>
      <Text>Selected: {value}</Text>
    </>
  );
}
