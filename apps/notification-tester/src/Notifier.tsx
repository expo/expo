import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
  AndroidImportance,
  Notification,
  NotificationChannel,
  NotificationResponse,
  EventSubscription as Subscription,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getExpoPushTokenAsync,
  getDevicePushTokenAsync,
  getLastNotificationResponseAsync,
  getPermissionsAsync,
  getNotificationChannelsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  useLastNotificationResponse,
  addPushTokenListener,
  NotificationContentAndroid,
} from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from 'expo-sqlite/kv-store';
import { useEffect, useState } from 'react';
import { Platform, Button } from 'react-native';

import { View, Text } from './Themed';
import { addItemToStorage, STORAGE_KEY } from './addItemToStorage';

export function useNotificationObserverInRootLayout() {
  usePushToken();
  useEffect(() => {
    addItemToStorage({
      source: 'EFFECT_RAN',
      notification: { type: 'empty' },
    });
    let isMounted = true;

    function redirect(response: NotificationResponse) {
      addItemToStorage({
        source: 'COMPONENT_RESPONSE_RECEIVED',
        notification: response.actionIdentifier,
      });
      const url = response?.notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }

    getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response) {
        return;
      }
      redirect(response);
    });

    const subscription = addNotificationResponseReceivedListener((response) => {
      redirect(response);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

const extractNotificationResponse = (response: NotificationResponse) => {
  return JSON.stringify(
    {
      actionIdentifier: response.actionIdentifier,
      title: response.notification.request.content.title,
    },
    null,
    2
  );
};

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
    Notifications.setNotificationCategoryAsync('submit_reply_placeholder', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        textInput: {
          submitButtonTitle: 'Reply',
          placeholder: 'Type a reply...',
        },
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'quickAction',
        buttonTitle: 'quickAction',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'openToForeground',
        buttonTitle: 'openToForeground',
        options: {
          opensAppToForeground: true,
        },
      },
    ]).catch(console.error);

    if (Platform.OS === 'android') {
      setNotificationChannelAsync('testAppWithSound2', {
        name: 'testAppWithSound',
        importance: AndroidImportance.HIGH,
        sound: 'pop_sound.wav',
        enableVibrate: true,
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
        notification,
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
      console.log(`${Platform.OS} removed listeners`);
    };
  }, []);

  const prettierNotification = notification
    ? {
        ...notification.request.content,
        body: notification.request.content.body
          ? JSON.parse(notification.request.content.body)
          : null,
      }
    : null;
  return (
    <View>
      <Text>Your expo push token:</Text>
      <Text selectable style={{ color: 'blue' }}>
        {expoPushToken}
      </Text>

      <Text>Your device push token</Text>
      <Text selectable style={{ color: 'blue' }}>
        {devicePushToken}
      </Text>
      <Text>{`Channels: ${JSON.stringify(
        channels.map((c: { id: string }) => c.id),
        null,
        2
      )}`}</Text>
      <View>
        <Text>
          notification: {prettierNotification && JSON.stringify(prettierNotification, null, 2)}
        </Text>
        <Text>
          Vibration:{' '}
          {notification &&
            JSON.stringify(
              (notification.request.content as NotificationContentAndroid).vibrationPattern ??
                'null'
            )}
        </Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
        <Text>Response received for: {response && extractNotificationResponse(response)}</Text>
        <Text>Last response: {lastResponse && extractNotificationResponse(lastResponse)}</Text>

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
          title="clear persistent storage"
        />
        <Button onPress={loadAsyncStorage} title="reload from persistent storage" />
        <Text>
          Persisted data:
          {backgroundTaskString && JSON.stringify(JSON.parse(backgroundTaskString), null, 2)}
        </Text>
      </View>
    </View>
  );
};

function usePushToken() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [devicePushToken, setDevicePushToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!expoPushToken) {
      registerForPushNotificationsAsync()
        .then((token) => {
          setExpoPushToken(token);
        })
        .catch((error) => {
          console.error(error);
          setExpoPushToken('error');
        });
    }
    if (expoPushToken) {
      if (!devicePushToken) {
        getDevicePushTokenAsync().then((token) => {
          const tokenString = JSON.stringify(token);
          console.log(tokenString);
          setDevicePushToken(tokenString);
        });
      }
      if (Platform.OS === 'android') {
        const subscription = addPushTokenListener((token) => {
          setExpoPushToken(token as unknown as string);
        });
        return () => {
          subscription.remove();
        };
      }
    }
  }, [expoPushToken, devicePushToken]);

  return {
    expoPushToken,
    devicePushToken,
  };
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('default', {
      name: 'default',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (isDevice) {
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // Here we use EAS projectId
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      const token = (
        await getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
      return token;
    } catch (e) {
      console.error(e);
      return '';
    }
  } else {
    console.error('Must use physical device for Push Notifications');
    return '';
  }
}
