import { DateTimePicker, DateTimePickerProps, Picker, Column } from '@expo/ui/jetpack-compose';
import { Host } from '@expo/ui/swift-ui';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const displayOptions = ['picker', 'input'];
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
          <View style={{ gap: 20 }}>
            <Host>
              <Column>
                <DateTimePicker
                  onDateSelected={(date) => {
                    setSelectedDate(date);
                  }}
                  displayedComponents={
                    typeOptions[typeIndex] as DateTimePickerProps['displayedComponents']
                  }
                  initialDate={selectedDate.toISOString()}
                  variant={displayOptions[selectedIndex] as DateTimePickerProps['variant']}
                  showVariantToggle
                  is24Hour
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
              </Column>
            </Host>
          </View>
        </Section>
      </Page>
    </ScrollView>
  );
}

DatePickerScreen.navigationOptions = {
  title: 'DatePicker',
};
