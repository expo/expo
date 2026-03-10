import {
  DateTimePicker,
  DateTimePickerProps,
  SingleChoiceSegmentedButtonRow,
  SegmentedButton,
  Text as ComposeText,
  Column,
  Host,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

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
          <Host matchContents={{ vertical: true }}>
            <Column>
              <SingleChoiceSegmentedButtonRow>
                {displayOptions.map((label, index) => (
                  <SegmentedButton
                    key={label}
                    selected={index === selectedIndex}
                    onClick={() => setSelectedIndex(index)}>
                    <SegmentedButton.Label>
                      <ComposeText>{label}</ComposeText>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                ))}
              </SingleChoiceSegmentedButtonRow>

              <SingleChoiceSegmentedButtonRow>
                {typeOptions.map((label, index) => (
                  <SegmentedButton
                    key={label}
                    selected={index === typeIndex}
                    onClick={() => setTypeIndex(index)}>
                    <SegmentedButton.Label>
                      <ComposeText>{label}</ComposeText>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                ))}
              </SingleChoiceSegmentedButtonRow>

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
            </Column>
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

DatePickerScreen.navigationOptions = {
  title: 'DatePicker',
};
