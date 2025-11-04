import { DateTimePicker, DateTimePickerProps, Picker, Column } from '@expo/ui/jetpack-compose';
import { Host } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const displayOptions = ['picker', 'input'];
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
                  style={{ height: Platform.select({ android: 520, ios: undefined }) }}
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
                  style={{ height: 30 }}
                />

                <Picker
                  options={typeOptions}
                  selectedIndex={typeIndex}
                  onOptionSelected={({ nativeEvent: { index } }) => {
                    setTypeIndex(index);
                  }}
                  variant="segmented"
                  style={{ height: 30 }}
                />
              </Column>
            </Host>
          </View>
        </Section>

        <Section title="Birthday Picker (Maximum: Today)">
          <Text>Prevents selecting dates in the future</Text>
          {birthday && <Text>Selected: {birthday.toDateString()}</Text>}
          <View style={{ gap: 20 }}>
            <Host>
              <DateTimePicker
                initialDate={birthday?.toISOString() ?? undefined}
                maximumDate={today.toISOString()}
                onDateSelected={setBirthday}
                variant="picker"
                style={{ height: Platform.select({ android: 520, ios: undefined }) }}
              />
            </Host>
          </View>
        </Section>

        <Section title="Hotel Check-in (Minimum: Today)">
          <Text>Prevents selecting dates in the past</Text>
          {checkInDate && <Text>Selected: {checkInDate.toDateString()}</Text>}
          <View style={{ gap: 20 }}>
            <Host>
              <DateTimePicker
                initialDate={checkInDate?.toISOString() ?? undefined}
                minimumDate={today.toISOString()}
                onDateSelected={setCheckInDate}
                variant="picker"
                style={{ height: Platform.select({ android: 520, ios: undefined }) }}
              />
            </Host>
          </View>
        </Section>

        <Section title="Meeting Time (Week Range)">
          <Text>Only allows selection within a one-week window</Text>
          {meetingDate && <Text>Selected: {meetingDate.toDateString()}</Text>}
          <View style={{ gap: 20 }}>
            <Host>
              <DateTimePicker
                initialDate={meetingDate?.toISOString() ?? undefined}
                minimumDate={oneWeekAgo.toISOString()}
                maximumDate={oneWeekFromNow.toISOString()}
                onDateSelected={setMeetingDate}
                variant="picker"
                style={{ height: Platform.select({ android: 520, ios: undefined }) }}
              />
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
