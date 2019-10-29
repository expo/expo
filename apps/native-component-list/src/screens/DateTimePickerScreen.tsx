import React from 'react';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, View, Text, Button, Platform } from 'react-native';

// This example is a copy from https://github.com/react-native-community/react-native-datetimepicker/tree/master/example
// Please try to keep it up to date when updating @react-native-community/datetimepicker package :)

type DateTimeMode = 'date' | 'datetime' | 'time';

type State = {
  date: Date;
  mode: DateTimeMode;
  show: boolean;
};

class DateTimePickerScreen extends React.Component {
  static navigationOptions = {
    title: 'DateTimePicker',
  };

  state: State = {
    date: new Date(1598051730000),
    mode: 'date',
    show: false,
  };

  setDate = (event: any, date?: Date) => {
    date = date || this.state.date;

    this.setState({
      show: Platform.OS === 'ios' ? true : false,
      date,
    });
  }

  show = (mode: DateTimeMode) => {
    this.setState({
      show: true,
      mode,
    });
  }

  datepicker = () => {
    this.show('date');
  }

  timepicker = () => {
    this.show('time');
  }

  render() {
    const { show, date, mode } = this.state;

    return (
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.text}>Example DateTime Picker</Text>
        </View>
        <View style={styles.button}>
          <Button testID="datePickerButton" onPress={this.datepicker} title="Show date picker!" />
        </View>
        <View style={styles.button}>
          <Button testID="timePickerButton" onPress={this.timepicker} title="Show time picker!" />
        </View>
        <View style={styles.header}>
          <Text testID="dateTimeText" style={styles.dateTimeText}>
            { mode === 'time' && moment.utc(date).format('HH:mm') }
            { mode === 'date' && moment.utc(date).format('MM/DD/YYYY') }
          </Text>
        </View>
        { show &&
          <DateTimePicker
            testID="dateTimePicker"
            timeZoneOffsetInMinutes={0}
            value={date}
            mode={mode}
            is24Hour={true}
            display="default"
            onChange={this.setDate} />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingVertical: 30,
  },
  footer: {
    color: '#333',
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: 'normal',
  },
});

export default DateTimePickerScreen;
