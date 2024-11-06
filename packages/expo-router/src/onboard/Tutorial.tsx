import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEntryFileAsync } from './createEntryFile';
import { Link } from '../exports';
import { Pressable } from '../views/Pressable';

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
    <SafeAreaView style={styles.background}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.logotypeWrapper}>
          <Image style={styles.logotype} source={require('expo-router/assets/logotype.png')} />
        </View>
        <Text role="heading" aria-level={1} style={styles.title}>
          Welcome to{' '}
          <Link
            href="https://docs.expo.dev/router/introduction/"
            {...Platform.select({ web: { target: '_blank' }, native: { asChild: true } })}>
            <Pressable>
              {({ hovered, pressed }) => (
                <Text
                  style={[
                    styles.title,
                    Platform.select({
                      web: {
                        transitionDuration: '200ms',
                        textDecorationColor: '#fff7',
                        textDecorationLine: 'underline',
                      },
                    }),
                    hovered && {
                      textDecorationColor: '#fff',
                    },
                    pressed &&
                      Platform.select({
                        native: {
                          color: '#fffb',
                        },
                      }),
                  ]}>
                  Expo Router
                </Text>
              )}
            </Pressable>
          </Link>
        </Text>
        <Text role="heading" aria-level={2} style={[styles.subtitle, styles.textSecondary]}>
          Start by creating a file{Platform.OS !== 'web' ? '\n' : ' '}in the{' '}
          <Text style={{ fontWeight: '600' }}>{getRootDir()}</Text> directory.
        </Text>
        {canAutoTouchFile && <Button />}
      </View>
    </SafeAreaView>
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
      style={styles.button}>
      {({ pressed, hovered }) => (
        <View
          style={[
            styles.buttonContainer,
            hovered && {
              backgroundColor: '#fff',
            },
            pressed &&
              Platform.select({
                web: {
                  transform: 'scale(0.98)',
                  transitionDuration: '200ms',
                },
                default: {
                  backgroundColor: '#fff',
                },
              }),
          ]}>
          <Text
            style={[
              styles.code,
              hovered && { color: '#000' },
              pressed &&
                Platform.select({
                  native: { color: '#000' },
                }),
            ]}>
            <Text style={styles.textSecondary}>$</Text> touch {getRootDir()}
            /index.tsx
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#000',
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 'auto',
    gap: 24,
    ...Platform.select({
      web: {
        maxWidth: 960,
      },
    }),
  },
  logotypeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151718',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#313538',
    width: 78,
    height: 78,
  },
  logotype: {
    width: 48,
    height: 44,
  },
  title: {
    ...Platform.select({
      web: {
        fontSize: 64,
      },
      default: {
        fontSize: 52,
      },
    }),
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonContainer: {
    ...Platform.select({
      web: {
        transitionDuration: '200ms',
      },
    }),
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  button: {
    ...Platform.select({
      web: {
        marginTop: 12,
      },
      native: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        overflow: 'hidden',
      },
    }),
  },
  code: {
    ...Platform.select({
      web: {
        transitionDuration: '200ms',
        fontFamily: 'Courier, monospace',
      },
      default: {
        fontFamily: Platform.select({
          ios: 'Courier New',
          android: 'monospace',
        }),
      },
    }),
    color: '#fff',
    textAlign: 'center',
    userSelect: 'none',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '200',
    textAlign: 'center',
  },
  textSecondary: {
    color: '#9ba1a6',
  },
});
