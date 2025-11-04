import { DateTimePicker, DateTimePickerProps, Host, Picker, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const displayOptions = ['compact', 'graphical', 'wheel'];
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const typeOptions = ['date', 'hourAndMinute', 'dateAndTime'];
  const [typeIndex, setTypeIndex] = React.useState(0);

  const [birthday, setBirthday] = React.useState<Date | null>(null);
  const [checkInDate, setCheckInDate] = React.useState<Date | null>(null);
  const [meetingDate, setMeetingDate] = React.useState<Date | null>(null);

  const today = new Date();
  const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

        <Section title="Birthday Picker (Maximum: Today)">
          <Text>Prevents selecting dates in the future</Text>
          {birthday && <Text>Selected: {birthday.toDateString()}</Text>}
          <Host matchContents>
            <DateTimePicker
              title="Select Birthday"
              initialDate={birthday?.toISOString() ?? undefined}
              maximumDate={today.toISOString()}
              onDateSelected={setBirthday}
              variant="compact"
            />
          </Host>
        </Section>

        <Section title="Hotel Check-in (Minimum: Today)">
          <Text>Prevents selecting dates in the past</Text>
          {checkInDate && <Text>Selected: {checkInDate.toDateString()}</Text>}
          <Host matchContents>
            <DateTimePicker
              title="Check-in Date"
              initialDate={checkInDate?.toISOString() ?? undefined}
              minimumDate={today.toISOString()}
              onDateSelected={setCheckInDate}
              variant="compact"
            />
          </Host>
        </Section>

        <Section title="Meeting Time (Week Range)">
          <Text>Only allows selection within a one-week window</Text>
          {meetingDate && <Text>Selected: {meetingDate.toDateString()}</Text>}
          <Host matchContents>
            <DateTimePicker
              title="Meeting Date"
              initialDate={meetingDate?.toISOString() ?? undefined}
              minimumDate={oneWeekFromNow.toISOString()}
              maximumDate={oneWeekAgo.toISOString()}
              onDateSelected={setMeetingDate}
              variant="compact"
            />
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

DatePickerScreen.navigationOptions = {
  title: 'DatePicker',
};
