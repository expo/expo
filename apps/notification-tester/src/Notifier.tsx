import {
  AndroidImportance,
  Notification,
  NotificationChannel,
  NotificationResponse,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getNotificationChannelsAsync,
  setNotificationChannelAsync,
  useLastNotificationResponse,
  NotificationContentAndroid,
} from 'expo-notifications';
import AsyncStorage from 'expo-sqlite/kv-store';
import { useEffect, useState } from 'react';
import { Platform, Button } from 'react-native';

import { View, Text } from './misc/Themed';
import { addItemToStorage, STORAGE_KEY } from './misc/addItemToStorage';
import { setupCategories } from './setupCategories';
import { usePushToken } from './usePushToken';

export const Notifier = () => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [notification, setNotification] = useState<Notification | undefined>(undefined);
  const [response, setResponse] = useState<NotificationResponse | undefined>(undefined);

  const [backgroundTaskString, setBackgroundTaskString] = useState<string | null>('');

  const loadAsyncStorage = () => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        console.log(`Retrieved value for STORAGE_KEY: ${value}`);
        setBackgroundTaskString(value);
      })
      .catch((reason) => {
        console.log(`Error retrieving value for STORAGE_KEY: ${reason}`);
        setBackgroundTaskString(reason);
      });
  };

  const lastResponse = useLastNotificationResponse();

  const { expoPushToken, devicePushToken } = usePushToken();

  useEffect(() => {
    setupCategories().catch(console.error);
    if (Platform.OS === 'android') {
      setNotificationChannelAsync('testAppWithSound2', {
        name: 'testAppWithSound',
        importance: AndroidImportance.HIGH,
        sound: 'pop_sound.wav',
        enableVibrate: true,
        showBadge: true,
        vibrationPattern: [0, 3000, 250, 250],
      })
        .then((value) => {
          console.log(`Set channel ${JSON.stringify(value, null, 2)}`);
          getNotificationChannelsAsync().then((value) => setChannels(value ?? []));
        })
        .catch((error) => {
          console.log(`Error in setting channel: ${error}`);
        });
    }

    const receivedListener = addNotificationReceivedListener((notification) => {
      addItemToStorage({
        source: 'NotificationReceivedListener',
        data: notification,
      });
      setNotification(notification);
      console.log(
        `${Platform.OS} addNotificationReceivedListener saw notification ${JSON.stringify(
          notification,
          null,
          2
        )}`
      );
    });

    const responseListener = addNotificationResponseReceivedListener((response) => {
      setResponse(response);
      console.log(`${Platform.OS} saw response for ${JSON.stringify(response, null, 2)}`);
    });

    console.log(`${Platform.OS} added listeners`);
    loadAsyncStorage();
    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  const prettierNotification = notification
    ? {
        ...notification.request.content,
        body: notification.request.content.body
          ? safeJsonParse(notification.request.content.body)
          : null,
      }
    : null;
  return (
    <View style={{ rowGap: 10 }}>
      <Text>Your expo push token:</Text>
      <Text selectable>{expoPushToken}</Text>

      <Text>Your device push token</Text>
      <Text selectable>{devicePushToken}</Text>
      <Text>{`Channels: ${JSON.stringify(
        channels.map((c: { id: string }) => c.id),
        null,
        2
      )}`}</Text>
      <Text>
        notification: {prettierNotification && JSON.stringify(prettierNotification, null, 2)}
      </Text>
      <Text>
        Vibration:{' '}
        {notification &&
          JSON.stringify(
            (notification.request.content as NotificationContentAndroid).vibrationPattern ?? 'null'
          )}
      </Text>
      <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      <Text>Response received for: {response && extractNotificationResponse(response)}</Text>
      <Text>Last response: {lastResponse && extractNotificationResponse(lastResponse)}</Text>

      <Button onPress={loadAsyncStorage} title="Reload from persistent storage" />
      <Button
        onPress={() => {
          AsyncStorage.clear()
            .then(() => {
              console.log('Cleared storage');
              setBackgroundTaskString('');
            })
            .catch((reason) => {
              console.log(`Error clearing storage: ${reason}`);
              setBackgroundTaskString(reason);
            });
        }}
        title="Clear persistent storage"
      />
      <Text>
        Persisted data:
        {backgroundTaskString && JSON.stringify(JSON.parse(backgroundTaskString), null, 2)}
      </Text>
    </View>
  );
};

const safeJsonParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

const extractNotificationResponse = (response: NotificationResponse) => {
  return JSON.stringify(
    {
      actionIdentifier: response.actionIdentifier,
      title: response.notification.request.content.title,
      userText: response.userText,
    },
    null,
    2
  );
};
