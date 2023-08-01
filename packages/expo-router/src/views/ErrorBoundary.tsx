import { Pressable, StyleSheet, Text, View } from '@bacons/react-views';
import { LogContext } from '@expo/metro-runtime/build/error-overlay/Data/LogContext';
import { LogBoxInspectorStackFrames } from '@expo/metro-runtime/build/error-overlay/overlay/LogBoxInspectorStackFrames';
import { LogBoxLog, parseErrorStack } from '@expo/metro-runtime/symbolicate';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link } from '../link/Link';
import { ErrorBoundaryProps } from './Try';

function useMetroSymbolication(error: Error) {
  const [logBoxLog, setLogBoxLog] = React.useState<LogBoxLog | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const stack = parseErrorStack(error.stack);

    const log = new LogBoxLog({
      level: 'error',
      message: {
        content: error.message,
        substitutions: [],
      },
      isComponentError: false,
      stack,
      category: error.message,
      componentStack: [],
    });

    log.symbolicate('stack', (symbolicatedLog) => {
      if (isMounted) {
        setLogBoxLog(log);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [error]);

  return logBoxLog;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const logBoxLog = useMetroSymbolication(error);
  const inTabBar = React.useContext(BottomTabBarHeightContext);
  const Wrapper = inTabBar ? View : SafeAreaView;

  return (
    <View style={styles.container}>
      <Wrapper style={{ flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }}>
        <View
          style={{
            marginBottom: 12,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text role="heading" aria-level={1} style={styles.title}>
            Something went wrong
          </Text>
        </View>

        <StackTrace logData={logBoxLog} />
        {process.env.NODE_ENV === 'development' && (
          <Link href="/_sitemap" style={styles.link}>
            Sitemap
          </Link>
        )}
        <Pressable onPress={retry}>
          {({ hovered, pressed }) => (
            <View
              style={[styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }]}>
              <Text
                style={[
                  styles.buttonText,
                  {
                    transitionDuration: '100ms',
                    color: hovered || pressed ? 'black' : 'white',
                  },
                ]}>
                Retry
              </Text>
            </View>
          )}
        </Pressable>
      </Wrapper>
    </View>
  );
}

function StackTrace({ logData }: { logData: LogBoxLog | null }) {
  if (!logData?.symbolicated?.stack?.stack) {
    return null;
  }
  return (
    <ScrollView style={{ flex: 1 }}>
      <LogContext.Provider
        value={{
          isDisabled: false,
          logs: [logData],
          selectedLogIndex: 0,
        }}>
        <LogBoxInspectorStackFrames onRetry={function () {}} type="stack" />
      </LogContext.Provider>
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
    fontSize: Platform.select({ web: 32, default: 24 }),
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  buttonInner: {
    transitionDuration: '100ms',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderColor: 'white',
    borderWidth: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
