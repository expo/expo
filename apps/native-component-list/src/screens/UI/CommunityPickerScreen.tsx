import { Picker, type PickerProps, type PickerRef } from '@expo/ui/community/picker';
import React, { useRef, useState } from 'react';
import { Button, Text } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

export default function CommunityPickerScreen() {
  return (
    <ScrollPage>
      <Section title="Standard">
        <GenericPicker />
      </Section>

      <Section title="Styled (backgroundColor, borderRadius)">
        <GenericPicker style={{ backgroundColor: '#e0e7ff', borderRadius: 12 }} />
      </Section>

      <Section title="Item color (iOS)">
        <ColoredPicker />
      </Section>

      <Section title="Item fontFamily (iOS)">
        <FontFamilyPicker />
      </Section>

      <Section title="Item enabled (Android)">
        <ItemEnabledPicker />
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

function ColoredPicker() {
  const [value, setValue] = useState<string>('java');

  return (
    <>
      <Picker selectedValue={value} onValueChange={(itemValue) => setValue(itemValue)}>
        <Picker.Item label="Java" value="java" color="#e11d48" />
        <Picker.Item label="JavaScript" value="js" color="#2563eb" />
        <Picker.Item label="Objective C" value="objc" color="#059669" />
        <Picker.Item label="Swift" value="swift" color="#d97706" />
      </Picker>
      <Text>Selected: {value}</Text>
    </>
  );
}

function FontFamilyPicker() {
  const [value, setValue] = useState<string>('java');

  return (
    <>
      <Picker selectedValue={value} onValueChange={(itemValue) => setValue(itemValue)}>
        <Picker.Item label="Java" value="java" fontFamily="Courier New" />
        <Picker.Item label="JavaScript" value="js" fontFamily="Georgia" />
        <Picker.Item label="Objective C" value="objc" fontFamily="Helvetica" />
        <Picker.Item label="Swift" value="swift" fontFamily="Menlo" />
      </Picker>
      <Text>Selected: {value}</Text>
    </>
  );
}

function ItemEnabledPicker() {
  const [value, setValue] = useState<string>('java');

  return (
    <>
      <Picker selectedValue={value} onValueChange={(itemValue) => setValue(itemValue)}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" enabled={false} />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" enabled={false} />
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
