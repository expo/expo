import {
  DateRangePicker,
  DateRangePickerDialog,
  Host,
  type DateRangeSelection,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const today = new Date();
const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

function formatSelectedDate(date: Date): string {
  const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return localDate.toLocaleDateString();
}

export default function DateRangePickerScreen() {
  const [showDialog, setShowDialog] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRangeSelection>({
    start: today,
    end: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.selection}>
        {selectedRange.start ? formatSelectedDate(selectedRange.start) : 'No start'} –{' '}
        {selectedRange.end ? formatSelectedDate(selectedRange.end) : 'No end'}
      </Text>
      <Button title="Show Date Range Dialog" onPress={() => setShowDialog(true)} />

      <Host style={styles.picker}>
        <DateRangePicker
          initialStartDate={selectedRange.start?.toISOString()}
          initialEndDate={selectedRange.end?.toISOString()}
          selectableDates={{ start: fiveDaysAgo, end: thirtyDaysFromNow }}
          onDateRangeSelected={setSelectedRange}
        />
      </Host>

      {showDialog && (
        <Host>
          <DateRangePickerDialog
            initialStartDate={selectedRange.start?.toISOString()}
            initialEndDate={selectedRange.end?.toISOString()}
            selectableDates={{ start: fiveDaysAgo, end: thirtyDaysFromNow }}
            confirmButtonLabel="Select"
            dismissButtonLabel="Never mind"
            onDateRangeSelected={(range) => {
              setSelectedRange(range);
              setShowDialog(false);
            }}
            onDismissRequest={() => setShowDialog(false)}
          />
        </Host>
      )}
    </View>
  );
}

DateRangePickerScreen.navigationOptions = {
  title: 'DateRangePicker',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  selection: {
    marginVertical: 8,
  },
  picker: {
    flex: 1,
    marginTop: 8,
  },
});
