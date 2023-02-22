import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Platform,
  TextInput,
  useColorScheme,
  Switch,
  TextProps,
  TextInputProps,
  Button,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const DAY_OF_WEEK = Object.freeze({
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
});

const ThemedText = (props: TextProps) => {
  const isDarkMode = useColorScheme() === 'dark';

  const textColorByMode = { color: isDarkMode ? Colors.white : Colors.black };

  const TextElement = React.createElement(Text, props);
  return React.cloneElement(TextElement, {
    style: [props.style, textColorByMode],
  });
};
const ThemedTextInput = (props: TextInputProps) => {
  const isDarkMode = useColorScheme() === 'dark';

  const textColorByMode = { color: isDarkMode ? Colors.white : Colors.black };

  const TextElement = React.createElement(TextInput, props);
  return React.cloneElement(TextElement, {
    style: [props.style, styles.textInput, textColorByMode],
    placeholderTextColor: isDarkMode ? Colors.white : Colors.black,
  });
};

const MODE_VALUES = Platform.select({
  ios: ['date', 'time', 'datetime', 'countdown'],
  android: ['date', 'time'],
})! as ['date', 'time', 'datetime', 'countdown'];
const DISPLAY_VALUES = Platform.select({
  ios: ['default', 'spinner', 'compact', 'inline'],
  android: ['default', 'spinner'],
})! as ['default', 'spinner'];
const MINUTE_INTERVALS = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30];

// This example is a refactored copy from https://github.com/react-native-community/react-native-datetimepicker/tree/master/example
// Please try to keep it up to date when updating @react-native-community/datetimepicker package :)

const DateTimePickerScreen = () => {
  // Sat, 13 Nov 2021 10:00:00 GMT (local: Saturday, November 13, 2021 11:00:00 AM GMT+01:00)
  const sourceMoment = moment.unix(1636797600);
  const sourceDate = sourceMoment.local().toDate();
  const [show, setShow] = useState(false);
  const [date, setDate] = useState<Date>(sourceDate);
  const [mode, setMode] = useState<'date' | 'time' | 'datetime' | 'countdown'>(MODE_VALUES[0]);
  const [textColor, setTextColor] = useState<string | undefined>();
  const [accentColor, setAccentColor] = useState<string | undefined>();
  const [display, setDisplay] = useState<'default' | 'spinner'>(DISPLAY_VALUES[0]);
  const [interval, setMinInterval] = useState(1);
  const [neutralButtonLabel, setNeutralButtonLabel] = useState<string | undefined>();
  const [disabled, setDisabled] = useState(false);
  const [neutralButtonPressed, setNeutralButtonPressed] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    const currentDate = selectedDate || date;
    if (event.type === 'neutralButtonPressed') {
      setNeutralButtonPressed(true);
      setDate(new Date());
    } else {
      setNeutralButtonPressed(false);
      setDate(currentDate);
    }
  };

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark : Colors.lighter,
  };

  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        testID="DateTimePickerScrollView"
        ref={scrollRef}
        onContentSizeChange={() => {
          if (Platform.OS === 'ios') {
            scrollRef.current?.scrollToEnd({ animated: true });
          }
        }}>
        {/* @ts-expect-error */}
        {global.HermesInternal != null && (
          <View style={styles.engine}>
            <Text testID="hermesIndicator" style={styles.footer}>
              Engine: Hermes
            </Text>
          </View>
        )}
        <View
          testID="appRootView"
          style={{ backgroundColor: isDarkMode ? Colors.black : Colors.white }}>
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
          {Platform.OS === 'ios' && (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.textLabel}>text color (iOS only)</ThemedText>
                <ThemedTextInput
                  value={textColor}
                  onChangeText={(text) => {
                    setTextColor(text.toLowerCase());
                  }}
                  placeholder="textColor"
                />
              </View>
              <View style={styles.header}>
                <ThemedText style={styles.textLabel}>accent color (iOS only)</ThemedText>
                <ThemedTextInput
                  value={accentColor}
                  onChangeText={(text) => {
                    setAccentColor(text.toLowerCase());
                  }}
                  placeholder="accentColor"
                />
              </View>
              <View style={styles.header}>
                <ThemedText style={styles.textLabel}>disabled (iOS only)</ThemedText>
                <Switch value={disabled} onValueChange={setDisabled} />
              </View>
            </>
          )}
          {Platform.OS === 'android' && (
            <View style={styles.header}>
              <ThemedText style={styles.textLabel}>neutralButtonLabel (android only)</ThemedText>
              <ThemedTextInput
                value={neutralButtonLabel}
                onChangeText={setNeutralButtonLabel}
                placeholder="neutralButtonLabel"
                testID="neutralButtonLabelTextInput"
              />
            </View>
          )}
          <View style={[styles.button, { flexDirection: 'row', justifyContent: 'space-around' }]}>
            <Button
              testID="showPickerButton"
              onPress={() => {
                setShow(true);
              }}
              title="Show picker!"
            />
            <Button testID="hidePicker" onPress={() => setShow(false)} title="Hide picker!" />
          </View>
          <View
            style={[
              styles.header,
              {
                flexDirection: 'column',
                justifyContent: 'space-around',
                alignContent: 'space-around',
              },
            ]}>
            <ThemedText testID="dateText" style={styles.dateTimeText}>
              {moment(date).format('MM/DD/YYYY  HH:mm')}
            </ThemedText>
            {neutralButtonPressed && (
              <ThemedText testID="neutralButtonPressed" style={styles.dateTimeText}>
                Neutral button was pressed, date changed to now.
              </ThemedText>
            )}
          </View>
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              minuteInterval={interval}
              value={date}
              mode={mode}
              is24Hour
              display={display}
              onChange={onChange}
              style={styles.iOsPicker}
              textColor={textColor || undefined}
              accentColor={accentColor || undefined}
              neutralButton={
                neutralButtonLabel ? { label: neutralButtonLabel, textColor: 'grey' } : undefined
              }
              disabled={disabled}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  textLabel: {
    margin: 10,
    flex: 1,
  },
  textInput: {
    height: 60,
    flex: 1,
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
  iOsPicker: {
    flex: 1,
    marginTop: 30,
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
