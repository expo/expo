import { DateTimePicker, DateTimePickerProps, Host, Picker, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Button, ScrollView, Text } from 'react-native';

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
          <Button
            title="Select Today + 15 Days"
            onPress={() => {
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + 15);
              setSelectedDate(futureDate);
            }}
          />
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
                date={selectedDate.toISOString()}
                range={{
                  lowerBound: new Date().toISOString(),
                  upperBound: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                }}
                variant={displayOptions[selectedIndex] as DateTimePickerProps['variant']}
              />

              <Picker
                options={displayOptions}
                selectedIndex={selectedIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setSelectedIndex(index);
                }}
                variant="segmented"
              />

              <Picker
                options={typeOptions}
                selectedIndex={typeIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setTypeIndex(index);
                }}
                variant="segmented"
              />
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
