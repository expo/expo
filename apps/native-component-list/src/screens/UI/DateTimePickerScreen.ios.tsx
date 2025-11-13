import {
  DateTimePicker,
  DateTimePickerProps,
  Host,
  Picker,
  Text as ExpoText,
  VStack,
} from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const displayOptions = ['compact', 'graphical', 'wheel'];
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const typeOptions = ['date', 'hourAndMinute', 'dateAndTime'];
  const [typeIndex, setTypeIndex] = React.useState(0);

  function getPickerType() {
    const str = displayOptions[selectedIndex];
    return `${str.charAt(0).toUpperCase()}${str.slice(1)} picker`;
  }

  return (
    <ScrollView>
      <Page>
        <Section title="Selected Date">
          <Text>{selectedDate.toDateString()}</Text>
        </Section>
        <Section title="Selected Time">
          <Text>{selectedDate.toTimeString()}</Text>
        </Section>
        <Section title={getPickerType()}>
          <Host matchContents>
            <VStack alignment="center" spacing={8}>
              <DateTimePicker
                onDateSelected={(date) => {
                  setSelectedDate(date);
                }}
                displayedComponents={
                  typeOptions[typeIndex] as DateTimePickerProps['displayedComponents']
                }
                title="Select date"
                initialDate={selectedDate.toISOString()}
                variant={displayOptions[selectedIndex] as DateTimePickerProps['variant']}
              />

              <Picker
                modifiers={[pickerStyle('segmented')]}
                selection={selectedIndex}
                onSelectionChange={({ nativeEvent: { selection } }) => {
                  setSelectedIndex(selection as number);
                }}>
                {displayOptions.map((option, index) => (
                  <ExpoText key={index} modifiers={[tag(index)]}>
                    {option}
                  </ExpoText>
                ))}
              </Picker>

              <Picker
                modifiers={[pickerStyle('segmented')]}
                selection={typeIndex}
                onSelectionChange={({ nativeEvent: { selection } }) => {
                  setTypeIndex(selection as number);
                }}>
                {typeOptions.map((option, index) => (
                  <ExpoText key={index} modifiers={[tag(index)]}>
                    {option}
                  </ExpoText>
                ))}
              </Picker>
            </VStack>
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

DatePickerScreen.navigationOptions = {
  title: 'DatePicker',
};
