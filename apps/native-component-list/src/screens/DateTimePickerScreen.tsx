/* eslint-disable */
// @ts-nocheck
import DateTimePicker from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import moment from 'moment';
import React, { useState } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const ThemedText = (props) => {
  const isDarkMode = useColorScheme() === 'dark';

  const textColorByMode = { color: isDarkMode ? Colors.white : Colors.black };

  const TextElement = React.createElement(Text, props);
  return React.cloneElement(TextElement, {
    style: [props.style, textColorByMode],
  });
};

const MODE_VALUES = Platform.select({
  ios: Object.values({
    date: 'date',
    time: 'time',
    datetime: 'datetime',
    countdown: 'countdown',
  }),
  android: Object.values({
    date: 'date',
    time: 'time',
  }),
});
const DISPLAY_VALUES = Platform.select({
  ios: Object.values({
    default: 'default',
    spinner: 'spinner',
    compact: 'compact',
    inline: 'inline',
  }),
  android: Object.values({
    default: 'default',
    spinner: 'spinner',
    clock: 'clock',
    calendar: 'calendar',
  }),
});
const MINUTE_INTERVALS = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30];

// This example is a refactored copy from https://github.com/react-native-community/react-native-datetimepicker/tree/master/example
// Please try to keep it up to date when updating @react-native-community/datetimepicker package :)

const DateTimePickerScreen = () => {
  const unixTime = 1598051730000;
  const [date, setDate] = useState(new Date(unixTime));
  const [mode, setMode] = useState(MODE_VALUES[0]);
  const [show, setShow] = useState(false);
  const [color, setColor] = useState();
  const [display, setDisplay] = useState(DISPLAY_VALUES[0]);
  const [interval, setMinInterval] = useState(1);
  const [minimumDate, setMinimumDate] = useState();
  const [maximumDate, setMaximumDate] = useState();

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;

    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark : Colors.lighter,
  };

  const toggleMinMaxDate = (enable) => {
    if (!enable) {
      setMinimumDate(undefined);
      setMaximumDate(undefined);
      return;
    }

    const startOfTodayUTC = moment(unixTime).utc().startOf('day').toDate();
    setMinimumDate(maximumDate ? undefined : startOfTodayUTC);
    const endOfTomorrowUTC = moment(unixTime).utc().endOf('day').add(1, 'day').toDate();
    setMaximumDate(minimumDate ? undefined : endOfTomorrowUTC);
  };

  return (
    <ScrollView contentContainerStyle={backgroundStyle}>
      {global.HermesInternal != null && (
        <View style={styles.engine}>
          <Text testID="hermesIndicator" style={styles.footer}>
            Engine: Hermes
          </Text>
        </View>
      )}
      <View
        testID="appRootView"
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}>
        <View style={styles.header}>
          <ThemedText style={styles.text}>Example DateTime Picker</ThemedText>
        </View>
        <ThemedText>mode prop:</ThemedText>
        <SegmentedControl
          values={MODE_VALUES}
          selectedIndex={MODE_VALUES.indexOf(mode)}
          onChange={(event) => {
            setMode(MODE_VALUES[event.nativeEvent.selectedSegmentIndex]);
          }}
        />
        <ThemedText>display prop:</ThemedText>
        <SegmentedControl
          values={DISPLAY_VALUES}
          selectedIndex={DISPLAY_VALUES.indexOf(display)}
          onChange={(event) => {
            setDisplay(DISPLAY_VALUES[event.nativeEvent.selectedSegmentIndex]);
          }}
        />
        <ThemedText>minute interval prop:</ThemedText>
        <SegmentedControl
          values={MINUTE_INTERVALS.map(String)}
          selectedIndex={MINUTE_INTERVALS.indexOf(interval)}
          onChange={(event) => {
            setMinInterval(MINUTE_INTERVALS[event.nativeEvent.selectedSegmentIndex]);
          }}
        />
        <View style={styles.header}>
          <ThemedText style={{ margin: 10, flex: 1 }}>text color (iOS only)</ThemedText>
          <TextInput
            value={color}
            style={{ height: 60, flex: 1 }}
            onChangeText={(text) => {
              setColor(text.toLowerCase());
            }}
            placeholder="color"
          />
        </View>
        <View style={styles.button}>
          <Button
            testID="showPickerButton"
            onPress={() => {
              toggleMinMaxDate(false);
              setShow(true);
            }}
            title="Show picker"
          />
        </View>

        <View style={styles.button}>
          <Button
            testID="toggleMinMaxDate"
            onPress={() => {
              toggleMinMaxDate(true);
              setShow(true);
            }}
            title="Show picker with min and max date"
          />
        </View>

        <View style={styles.button}>
          <Button testID="hidePicker" onPress={() => setShow(false)} title="Hide picker" />
        </View>

        <View style={styles.header}>
          <ThemedText testID="dateText" style={styles.dateTimeText}>
            Selected: {moment.utc(date).format('MM/DD/YYYY')}
          </ThemedText>
          <Text> </Text>
          <ThemedText testID="timeText" style={styles.dateTimeText}>
            {moment.utc(date).format('HH:mm')}
          </ThemedText>
        </View>

        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            timeZoneOffsetInMinutes={0}
            minuteInterval={interval}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            value={date}
            mode={mode}
            is24Hour
            display={display}
            onChange={onChange}
            style={styles.pickerIOS}
            textColor={color || undefined}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  container: {
    marginTop: 32,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  containerWindows: {
    marginTop: 32,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
  },
  button: {
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    width: 150,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  pickerIOS: {
    flex: 1,
  },
  windowsPicker: {
    flex: 1,
    paddingTop: 10,
    width: 350,
  },
});

DateTimePickerScreen.navigationOptions = {
  title: 'DateTimePicker',
};

export default DateTimePickerScreen;
