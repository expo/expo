import { Pressable, StyleSheet, Text, View } from '@bacons/react-views';
import React from 'react';
import { Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link } from '../link/Link';
import { ErrorBoundaryProps } from './Try';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={[styles.container]}>
      <SafeAreaView style={{ flex: 1, maxWidth: 720, marginHorizontal: 'auto' }}>
        <View
          style={{
            marginBottom: 12,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text accessibilityRole="header" accessibilityLevel={1} style={styles.title}>
            Something went wrong
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable>
              {({ hovered }) => (
                <TouchableOpacity onPress={retry}>
                  <View
                    style={[
                      {
                        transitionDuration: '100ms',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderColor: 'white',
                        borderWidth: 2,
                        marginLeft: 8,
                      },
                      hovered && { backgroundColor: 'white' },
                    ]}>
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          transitionDuration: '100ms',
                          color: hovered ? 'black' : 'white',
                        },
                      ]}>
                      Retry
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </Pressable>
          </View>
        </View>

        <StackTrace error={error} />
        {process.env.NODE_ENV === 'development' && (
          <Link href="/_sitemap" style={styles.link}>
            Sitemap
          </Link>
        )}
      </SafeAreaView>
    </View>
  );
}

function StackTrace({ error }: { error: Error }) {
  return (
    <ScrollView
      style={{
        marginVertical: 8,
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        padding: 12,
      }}>
      <Text style={[styles.code, { color: 'white' }]}>{error.stack}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 24,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 36,

    // textAlign: "center",
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  code: {
    fontFamily: Platform.select({
      default: 'Courier',
      ios: 'Courier New',
      android: 'monospace',
    }),
    fontWeight: '500',
  },
  subtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
    // textAlign: "center",
  },
  link: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});
