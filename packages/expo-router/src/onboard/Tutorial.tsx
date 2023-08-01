import { View, Text, Pressable, StyleSheet } from '@bacons/react-views';
import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEntryFileAsync } from './createEntryFile';

// TODO: Use openLinkFromBrowser thing
function Header() {
  return (
    <Pressable>
      {({ hovered }) => (
        <Text
          role="heading"
          aria-level={1}
          style={[styles.title, Platform.OS !== 'web' && { textAlign: 'left' }]}>
          Welcome to{' '}
          <Text
            href="https://github.com/expo/expo-router/"
            style={[
              hovered && {
                textDecorationColor: 'white',
                textDecorationLine: 'underline',
              },
            ]}>
            Expo
          </Text>
        </Text>
      )}
    </Pressable>
  );
}

const canAutoTouchFile = process.env.EXPO_ROUTER_APP_ROOT != null;

export function Tutorial() {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // Reset the route on web so the initial route isn't a 404 after
      // the user has created the entry file.
      // This is useful for cases where you are testing the tutorial.
      // To test: touch the new file, then navigate to a missing route `/foobar`, then delete the app folder.
      // you should see the tutorial again and be able to create the entry file once more.
      if (typeof location !== 'undefined' && location.pathname !== '/') {
        location.replace('/');
      }
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        window.document.title = 'npx expo start';
      }
    }
  }, []);

  return (
    <View style={styles.background}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header />
          <Text role="heading" aria-level={2} style={styles.subtitle}>
            Start by creating a file{'\n'}in the{' '}
            <Text style={{ fontWeight: 'bold' }}>{getRootDir()}</Text> directory.
          </Text>
          {canAutoTouchFile && <Button />}
        </View>
      </SafeAreaView>
    </View>
  );
}

function getRootDir() {
  const dir = process.env.EXPO_ROUTER_ABS_APP_ROOT!;
  if (dir.match(/\/src\/app$/)) {
    return 'src/app';
  } else if (dir.match(/\/app$/)) {
    return 'app';
  }
  return dir.split('/').pop() ?? dir;
}

function Button() {
  return (
    <Pressable
      onPress={() => {
        createEntryFileAsync();
      }}
      style={{
        ...Platform.select({
          web: {
            // subtle white shadow
            boxShadow: 'rgba(255, 255, 255, 0.15) 0px 0px 20px 5px',
          },
          native: {
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            overflow: 'hidden',
          },
        }),
      }}>
      {({ pressed, hovered }) => (
        <View
          style={[
            styles.buttonContainer,
            hovered && {
              backgroundColor: 'white',
            },
            pressed && {
              backgroundColor: 'rgba(255,255,255,0.7)',
            },
          ]}>
          <Text style={[styles.code, hovered && { color: 'black' }]}>
            <Text style={{ color: '#BCC3CD' }}>$</Text> touch {getRootDir()}
            /index.js
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'black',
    flex: 1,
    backgroundImage:
      'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
    backgroundPositionX: -3,
    backgroundPositionY: -3,
    backgroundSize: '40px 40px',
  },
  safeArea: {
    flex: 1,
    maxWidth: 960,
    marginHorizontal: 'auto',
    alignItems: 'stretch',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 64,
    paddingBottom: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    transitionDuration: '200ms',
    backgroundColor: Platform.select({
      web: 'transparent',
      default: 'white',
    }),

    borderColor: 'white',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'black',
  },
  code: {
    userSelect: 'none',
    fontSize: 18,
    transitionDuration: '200ms',
    fontWeight: 'bold',
    color: Platform.select({
      web: 'white',
      default: 'black',
    }),
    fontFamily: Platform.select({
      default: 'Courier',
      ios: 'Courier New',
      android: 'monospace',
    }),
  },
  subtitle: {
    color: '#BCC3CD',
    fontSize: 36,
    fontWeight: '100',
    paddingBottom: 36,
    maxWidth: 960,
  },
});
