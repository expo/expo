'use client';

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React, { type PropsWithChildren } from 'react';
import { ActivityIndicator, Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CODE_FONT = Platform.select({
  default: 'Courier',
  ios: 'Courier New',
  android: 'monospace',
});

function useFadeIn() {
  // Returns a React Native Animated value for fading in
  const [value] = React.useState(() => new Animated.Value(0));
  React.useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);
  return value;
}

export function ToastWrapper({ children }: React.PropsWithChildren) {
  const inTabBar = React.useContext(BottomTabBarHeightContext);
  const Wrapper = inTabBar ? View : SafeAreaView;

  return (
    <Wrapper collapsable={false} style={{ flex: 1 }}>
      {children}
    </Wrapper>
  );
}

export function Toast({
  children,
  filename,
  warning,
}: PropsWithChildren<{
  filename?: string;
  warning?: boolean;
}>) {
  const filenamePretty = React.useMemo(() => {
    if (!filename) return undefined;
    return 'app' + filename.replace(/^\./, '');
  }, [filename]);
  const value = useFadeIn();
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.toast,
          // @ts-expect-error: fixed is supported on web.
          {
            position: Platform.select({
              web: 'fixed',
              default: 'absolute',
            }),
            opacity: value,
          },
        ]}>
        {!warning && <ActivityIndicator color="white" />}
        {warning && <Image source={require('expo-router/assets/error.png')} style={styles.icon} />}
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.text}>{children}</Text>
          {filenamePretty && <Text style={styles.filename}>{filenamePretty}</Text>}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  icon: { width: 20, height: 20, resizeMode: 'contain' },
  toast: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    bottom: 8,
    left: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'black',
  },
  text: { color: 'white', fontSize: 16 },
  filename: {
    fontFamily: CODE_FONT,
    opacity: 0.8,
    color: 'white',
    fontSize: 12,
  },
  code: { fontFamily: CODE_FONT },
});
