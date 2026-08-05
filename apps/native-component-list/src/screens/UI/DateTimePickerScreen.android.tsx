import {
  DateTimePicker,
  DateTimePickerProps,
  SingleChoiceSegmentedButtonRow,
  SegmentedButton,
  Text as ComposeText,
  DatePickerDialog,
  TimePickerDialog,
  Column,
  Host,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Alert, Button, ScrollView, Switch, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

const today = new Date();
const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const displayOptions = ['picker', 'input'];
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const typeOptions = ['hourAndMinute', 'date', 'dateAndTime'];
  const [typeIndex, setTypeIndex] = React.useState(0);

  const [showDateDialog, setShowDateDialog] = React.useState(false);
  const [showTimeDialog, setShowTimeDialog] = React.useState(false);
  const [is24Hour, setIs24Hour] = React.useState(true);

  const [ticking, setTicking] = React.useState(false);
  React.useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => {
      setSelectedDate((d) => new Date(d.getTime() + 60_000));
    }, 1000);
    return () => clearInterval(id);
  }, [ticking]);

  function getPickerType() {
    const str = displayOptions[selectedIndex];
    return `${str.charAt(0).toUpperCase()}${str.slice(1)} picker`;
  }

  return (
    <ScrollView>
      <Page>
        <Section title="24-mode">
          <Switch value={is24Hour} onValueChange={setIs24Hour} />
        </Section>

        <Section title="Auto-advance">
          <Button
            title={ticking ? 'Stop' : 'Start (+1 min/s)'}
            onPress={() => setTicking((t) => !t)}
          />
        </Section>
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
                is24Hour={is24Hour}
              />
            </Column>
          </Host>
        </Section>

        <Section title="With selectableDates (-5d … +30d)">
          <Host matchContents={{ vertical: true }}>
            <DateTimePicker
              onDateSelected={(date) => setSelectedDate(date)}
              displayedComponents="date"
              initialDate={selectedDate.toISOString()}
              selectableDates={{ start: fiveDaysAgo, end: thirtyDaysFromNow }}
            />
          </Host>
        </Section>

        <Section title="DatePickerDialog">
          <Button title="Show Date Dialog" onPress={() => setShowDateDialog(true)} />
          {showDateDialog && (
            <Host>
              <DatePickerDialog
                initialDate={selectedDate.toISOString()}
                selectableDates={{ start: fiveDaysAgo, end: thirtyDaysFromNow }}
                confirmButtonLabel="Select"
                dismissButtonLabel="Never mind"
                onDateSelected={(date) => {
                  setSelectedDate(date);
                  setShowDateDialog(false);
                }}
                onDismissRequest={() => {
                  setShowDateDialog(false);
                  Alert.alert('Dismissed', 'Date picker dialog was dismissed', [{ text: 'OK' }], {
                    cancelable: true,
                  });
                }}
              />
            </Host>
          )}
        </Section>

        <Section title="TimePickerDialog">
          <Button title="Show Time Dialog" onPress={() => setShowTimeDialog(true)} />
          {showTimeDialog && (
            <Host>
              <TimePickerDialog
                initialDate={selectedDate.toISOString()}
                is24Hour={is24Hour}
                confirmButtonLabel="Set"
                dismissButtonLabel="Nope"
                onDateSelected={(date) => {
                  setSelectedDate(date);
                  setShowTimeDialog(false);
                }}
                onDismissRequest={() => {
                  setShowTimeDialog(false);
                  Alert.alert('Dismissed', 'Time picker dialog was dismissed', [{ text: 'OK' }], {
                    cancelable: true,
                  });
                }}
              />
            </Host>
          )}
        </Section>

        <Section title="Colored date picker">
          <Host matchContents={{ vertical: true }}>
            <DateTimePicker
              onDateSelected={(date) => setSelectedDate(date)}
              displayedComponents="date"
              initialDate={selectedDate.toISOString()}
              color="#E040FB"
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
