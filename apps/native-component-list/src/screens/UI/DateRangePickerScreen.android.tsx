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

export default function DateRangePickerScreen() {
  const [showDialog, setShowDialog] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRangeSelection>({
    start: today,
    end: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.selection}>
        {selectedRange.start?.toDateString() ?? 'No start'} –{' '}
        {selectedRange.end?.toDateString() ?? 'No end'}
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
