import * as Notifications from 'expo-notifications';
import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

const showNotification = () => {
  Notifications.presentNotificationAsync({
    title: 'Notification',
  });
};

const scheduleNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Here is a scheduled notification!',
      body: 'This is the body',
      data: {
        hello: 'there',
        future: 'self',
      },
      sound: true,
    },
    trigger: null,
  });
};

export default function Main() {
  // @ts-ignore
  // if (global.DETOX) {
  //   React.useEffect(() => {
  //     addListener(data => {
  //       if (data.globals) {
  //         for (const moduleName of data.globals) {
  //           // @ts-ignore
  //           global[moduleName] = createProxy(moduleName);
  //         }
  //       }
  //     });

  //     let stop;
  //     startAsync().then(_stop => (stop = _stop));

  //     return () => stop && stop();
  //   }, []);
  // }

  // React.useEffect(() => {
  //   try {
  //     const subscription = Notifications.addNotificationResponseReceivedListener(
  //       ({ notification, actionIdentifier }) => {
  //         console.info(
  //           `User interacted with a notification (action = ${actionIdentifier}): ${JSON.stringify(
  //             notification,
  //             null,
  //             2
  //           )}`
  //         );
  //       }
  //     );
  //     return () => subscription?.remove();
  //   } catch (e) {
  //     console.debug('Could not have added a listener for received notification responses.', e);
  //   }
  // }, []);

  // return <MainNavigator uriPrefix="bareexpo://" />;

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Button title="Show notification" onPress={showNotification} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button title="Schedule notification" onPress={scheduleNotification} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    padding: 10,
  },
  button: {
    alignSelf: 'center',
  },
});
