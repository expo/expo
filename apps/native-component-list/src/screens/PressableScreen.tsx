// @ts-nocheck
/*
 * From the RNW docs:
 * https://necolas.github.io/react-native-web/docs/?path=/docs/components-pressable--disabled#pressable
 */
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { Page, Section } from '../components/Page';

export default function PressableScreen() {
  return (
    <ScrollView>
      <Page>
        <Section title="FeedbackEvents">
          <FeedbackEvents />
        </Section>
        <Section title="Delay">
          <DelayEvents />
        </Section>
        <Section title="Disabled">
          <Disabled />
        </Section>
      </Page>
    </ScrollView>
  );
}

PressableScreen.navigationOptions = {
  title: 'Pressable',
};

function DelayEvents() {
  const [eventLog, updateEventLog] = React.useState([]);

  const handlePress = (eventName: string) => {
    return () => {
      const limit = 6;
      updateEventLog((state) => {
        const nextState = state.slice(0, limit - 1);
        nextState.unshift(eventName);
        return nextState;
      });
    };
  };

  return (
    <View>
      <View>
        <Pressable
          delayLongPress={800}
          delayPressIn={400}
          delayPressOut={1000}
          onLongPress={handlePress('longPress: 800ms delay')}
          onPress={handlePress('press')}
          onPressIn={handlePress('pressIn: 400ms delay')}
          onPressOut={handlePress('pressOut: 1000ms delay')}>
          <View>
            <Text style={styles.touchableText}>Pressable</Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.eventLogBox}>
        {eventLog.map((e, ii) => (
          <Text key={ii}>{e}</Text>
        ))}
      </View>
    </View>
  );
}

function Disabled() {
  return (
    <View>
      <Pressable disabled onPress={action('Pressable')}>
        <View style={[styles.row, styles.block]}>
          <Text style={styles.disabledTouchableText}>Disabled Pressable</Text>
        </View>
      </Pressable>

      <Pressable onPress={action('Pressable')}>
        <View style={[styles.row, styles.block]}>
          <Text style={styles.touchableText}>Enabled Pressable</Text>
        </View>
      </Pressable>
    </View>
  );
}

function FeedbackEvents() {
  const [eventLog, updateEventLog] = React.useState([]);

  const handlePress = (eventName: string) => {
    return () => {
      const limit = 6;
      updateEventLog((state) => {
        const nextState = state.slice(0, limit - 1);
        nextState.unshift(eventName);
        return nextState;
      });
    };
  };

  return (
    <View>
      <View>
        <Pressable
          onLongPress={handlePress('longPress')}
          onPress={handlePress('press')}
          onPressIn={handlePress('pressIn')}
          onPressOut={handlePress('pressOut')}>
          <View>
            <Text style={styles.touchableText}>Press Me</Text>
          </View>
        </Pressable>
      </View>

      <View>
        <Pressable
          accessibilityRole="none"
          onLongPress={handlePress('longPress')}
          onPress={handlePress('press')}
          onPressIn={handlePress('pressIn')}
          onPressOut={handlePress('pressOut')}
          style={({ pressed, focused }) => ({
            padding: 10,
            margin: 10,
            borderWidth: 1,
            borderColor: focused ? 'blue' : null,
            backgroundColor: pressed ? 'lightblue' : 'white',
          })}>
          <Pressable
            accessibilityRole="none"
            onLongPress={handlePress('longPress - inner')}
            onPress={handlePress('press - inner')}
            onPressIn={handlePress('pressIn - inner')}
            onPressOut={handlePress('pressOut - inner')}
            style={({ pressed, focused }) => ({
              padding: 10,
              margin: 10,
              borderWidth: 1,
              borderColor: focused ? 'blue' : null,
              backgroundColor: pressed ? 'lightblue' : 'white',
            })}>
            <Text>Nested pressables</Text>
          </Pressable>
        </Pressable>
      </View>

      <View style={styles.eventLogBox}>
        {eventLog.map((e, ii) => (
          <Text key={ii}>{e}</Text>
        ))}
      </View>
    </View>
  );
}

const action = (msg: string) => () => {
  console.log(msg);
};

const styles = StyleSheet.create({
  touchableText: {
    borderRadius: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: 'black',
    color: '#007AFF',
    borderStyle: 'solid',
    textAlign: 'center',
  },
  disabledTouchableText: {
    borderRadius: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: 'gray',
    color: 'gray',
    borderStyle: 'solid',
    textAlign: 'center',
  },
  eventLogBox: {
    padding: 10,
    marginTop: 10,
    height: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  row: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  block: {
    padding: 10,
  },
});
