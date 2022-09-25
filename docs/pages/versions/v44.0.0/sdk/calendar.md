---
title: Calendar
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-calendar'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

Provides an API for interacting with the device's system calendars, events, reminders, and associated records.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-calendar" />

## Configuration

You must add the following permissions to your **app.json**.
- Android requires `READ_CALENDAR` & `WRITE_CALENDAR` inside the `expo.android.permissions` array.
- iOS requires the `NSRemindersUsageDescription` key be added to `expo.ios.infoPlist` with a string value describing the reason for the permission request.

## Usage

<SnackInline label='Basic Calendar usage' dependencies={['expo-calendar']}>

```jsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Button, Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        console.log('Here are all your calendars:');
        console.log({ calendars });
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Calendar Module Example</Text>
      <Button title="Create a new calendar" onPress={createCalendar} />
    </View>
  );
}

async function getDefaultCalendarSource() {
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  return defaultCalendar.source;
}

async function createCalendar() {
  const defaultCalendarSource =
    Platform.OS === 'ios'
      ? await getDefaultCalendarSource()
      : { isLocalAccount: true, name: 'Expo Calendar' };
  const newCalendarID = await Calendar.createCalendarAsync({
    title: 'Expo Calendar',
    color: 'blue',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendarSource.id,
    source: defaultCalendarSource,
    name: 'internalCalendarName',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  console.log(`Your new calendar ID is: ${newCalendarID}`);
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import * as Calendar from 'expo-calendar';
```

<APISection packageName="expo-calendar" apiName="Calendar" />