import { ThemeProvider } from 'ThemeProvider';
import * as Splashscreen from 'expo-splash-screen';
import React from 'react';
import * as DevMenu from 'expo-dev-menu';
import { Button, Host, SyncTextField, VStack } from '@expo/ui/swift-ui';
import MainNavigator, { optionalRequire } from './MainNavigator';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import ListScreen from 'native-component-list/src/screens/UI/ListScreen.ios';

let Notifications;
try {
  Notifications = require('expo-notifications');
} catch {
  // do nothing
}

DevMenu.registerDevMenuItems([
  {
    name: 'Action 1',
    callback: () => {
      console.log('Action 1 executed');
    },
    shouldCollapse: true,
  },
  {
    name: 'Action 2',
    callback: () => {
      console.log('Action 2 executed');
    },
    shouldCollapse: false,
  },
]);

Splashscreen.setOptions({ fade: true, duration: 800 });

// Require the `BackgroundTaskScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundTaskScreen'));

// Require the `BackgroundFetchScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundFetchScreen'));

const loadAssetsAsync =
  optionalRequire(() => require('native-component-list/src/utilities/loadAssetsAsync')) ??
  (async () => null);

function useLoaded() {
  const [isLoaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let isMounted = true;
    // @ts-ignore
    loadAssetsAsync()
      .then(() => {
        if (isMounted) setLoaded(true);
        Splashscreen.hide();
      })
      .catch((e) => {
        console.warn('Error loading assets: ' + e.message);
        if (isMounted) setLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  return isLoaded;
}

export default function Main() {
  React.useEffect(() => {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(
        ({ notification, actionIdentifier }) => {
          console.info(
            `User interacted with a notification (action = ${actionIdentifier}): ${JSON.stringify(
              notification,
              null,
              2
            )}`
          );
        }
      );
      return () => subscription?.remove();
    } catch (e) {
      console.debug('Could not have added a listener for received notification responses.', e);
    }
  }, []);

  const isLoaded = useLoaded();

  return <ThemeProvider>{isLoaded ? <TestScreen /> : null}</ThemeProvider>;
}

const TestScreen = () => {
  const syncTextFieldRef = React.useRef<any>(null);

  const [asyncText, setAsyncText] = React.useState("");
  const onChangeText = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
    setAsyncText(filtered);
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync vs Async Text Input</Text>
        <Text style={styles.subtitle}>
          Type numbers or special characters to see the difference
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>React Native TextInput (Async)</Text>
        <Text style={styles.hint}>Flickers when filtering invalid chars</Text>
        <TextInput
          value={asyncText}
          onChangeText={onChangeText}
          placeholder="Type here..."
          style={styles.rnInput}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expo UI SyncTextField (Sync)</Text>
        <Text style={styles.hint}>No flicker - filtered on UI thread</Text>
        <Host matchContents>
          <VStack>
            <SyncTextField
              ref={syncTextFieldRef}
              defaultValue="Hello"
              onChangeSync={(value) => {
                'worklet';
                const filtered = value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
                return filtered !== value ? filtered : undefined;
              }}
            />
          </VStack>
        </Host>
      </View>

      <Host matchContents>
        <VStack>
          <Button
            label="Reset Both"
            onPress={() => {
              syncTextFieldRef.current?.setState("");
              setAsyncText("");
            }}
          />
        </VStack>
      </Host>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  rnInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});