import {
  type ExpoCalendar,
  getCalendarPermissions,
  presentPicker,
  requestCalendarPermissions,
  useCalendarPermissions,
} from 'expo-calendar/next';
import { type ReactNode, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

type StepProps = {
  number: number;
  title: string;
  description: string;
  children?: ReactNode;
};

function Step({ number, title, description, children }: StepProps) {
  return (
    <View style={styles.step}>
      <HeadingText>{`${number}. ${title}`}</HeadingText>
      <Text style={styles.description}>{description}</Text>
      {children}
    </View>
  );
}

export default function WriteOnlyPermissionsScreen() {
  const [calendar, setCalendar] = useState<ExpoCalendar | null>(null);
  const [, requestWriteOnlyPermission] = useCalendarPermissions({
    writeOnly: true,
  });

  const pickWriteOnlyCalendar = async () => {
    try {
      const calendar = await presentPicker();
      if (calendar) {
        setCalendar(calendar);
        Alert.alert('Calendar picked', `Title: ${calendar.title}\nID: ${calendar.id}`);
      } else {
        Alert.alert('Calendar picker cancelled');
      }
    } catch (e: any) {
      Alert.alert('Failed to pick calendar', e.message);
    }
  };

  const requestWriteOnlyAccess = async () => {
    try {
      const output = await requestWriteOnlyPermission();
      Alert.alert('Write-Only Permission Status', JSON.stringify(output, null, 2));
    } catch (e: any) {
      Alert.alert('Failed to request write-only permission', e.message);
    }
  };

  const checkWriteOnlyPermission = async () => {
    try {
      const output = await getCalendarPermissions(true);
      Alert.alert('Write-Only Permission Status', JSON.stringify(output, null, 2));
    } catch (e: any) {
      Alert.alert('Failed to check write-only permission', e.message);
    }
  };

  const checkFullAccessPermission = async () => {
    try {
      const output = await getCalendarPermissions();
      Alert.alert('Full Access Permission Status', JSON.stringify(output, null, 2));
    } catch (e: any) {
      Alert.alert('Failed to check full access permission', e.message);
    }
  };

  const requestFullAccessPermission = async () => {
    try {
      const output = await requestCalendarPermissions();
      Alert.alert('Full Access Permission Status', JSON.stringify(output, null, 2));
    } catch (e: any) {
      Alert.alert('Failed to request full access', e.message);
    }
  };

  const addEventToCalendar = async () => {
    if (!calendar) {
      Alert.alert('No calendar', 'Pick a calendar first.');
      return;
    }
    try {
      const timeInOneHour = new Date();
      timeInOneHour.setHours(timeInOneHour.getHours() + 1);
      const event = await calendar.createEvent({
        title: 'Write-Only Test Event',
        startDate: new Date(),
        endDate: timeInOneHour,
        timeZone: 'America/Los_Angeles',
      });
      Alert.alert('Event created', `ID: ${event.id}`);
    } catch (e: any) {
      Alert.alert('Failed to create event', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <HeadingText>Write-Only Permissions</HeadingText>
      <Text style={styles.intro}>
        Follow these steps on iOS 17+ to verify that write-only calendar permissions can create
        events without first granting full calendar access.
      </Text>

      <Step
        number={1}
        title="Start clean"
        description="Remove Calendar permissions for this app in iOS Settings, then check both write-only and full access statuses before requesting anything.">
        <Button
          onPress={checkWriteOnlyPermission}
          title="Check Write-Only Status"
          style={styles.button}
        />
        <Button
          onPress={checkFullAccessPermission}
          title="Check Full Access Status"
          style={styles.button}
        />
      </Step>

      <Step
        number={2}
        title="Request write-only access"
        description="Accept the write-only prompt. The request result appears in an alert.">
        <Button
          onPress={requestWriteOnlyAccess}
          title="Request Write-Only Permission"
          style={styles.button}
        />
      </Step>

      <Step
        number={3}
        title="Pick the destination calendar"
        description="Use the system picker to choose where the test event should be created.">
        <Button onPress={pickWriteOnlyCalendar} title="Present Picker" style={styles.button} />
      </Step>

      <Step
        number={4}
        title="Create an event"
        description="Create a test event in the picked calendar. This is the write-only path.">
        <Button
          onPress={addEventToCalendar}
          title="Add Event to Calendar"
          style={styles.button}
          disabled={!calendar}
        />
      </Step>

      <Step
        number={5}
        title="Request full access"
        description="Test whether full access permissions can be requested after the app already has write-only access.">
        <Button
          onPress={requestFullAccessPermission}
          title="Request Full Access Permission"
          style={styles.button}
        />
      </Step>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  intro: {
    marginBottom: 16,
    color: '#444',
  },
  step: {
    marginBottom: 18,
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  button: {
    marginBottom: 8,
  },
});
