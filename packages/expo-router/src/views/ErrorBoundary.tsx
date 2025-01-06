'use client';
import type { LogBoxLog } from '@expo/metro-runtime/symbolicate';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { ComponentType, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from './Pressable';
import { ErrorBoundaryProps } from './Try';
import { Link } from '../link/Link';
import { ReactServerError } from '../rsc/router/errors';

let useMetroSymbolication: (error: Error) => LogBoxLog | null;

if (process.env.NODE_ENV === 'development') {
  const { LogBoxLog, parseErrorStack } =
    require('@expo/metro-runtime/symbolicate') as typeof import('@expo/metro-runtime/symbolicate');
  useMetroSymbolication = function (error: Error) {
    const [logBoxLog, setLogBoxLog] = useState<LogBoxLog | null>(null);

    useEffect(() => {
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

      log.symbolicate('stack', () => {
        if (isMounted) {
          setLogBoxLog(log);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [error]);

    return logBoxLog;
  };
} else {
  useMetroSymbolication = function () {
    return null;
  };
}

let StackTrace: ComponentType<{ logData: LogBoxLog | null }>;

if (process.env.NODE_ENV === 'development') {
  const { LogContext } = require('@expo/metro-runtime/src/error-overlay/Data/LogContext');
  const {
    LogBoxInspectorStackFrames,
  } = require('@expo/metro-runtime/src/error-overlay/overlay/LogBoxInspectorStackFrames');

  StackTrace = function ({ logData }: { logData: LogBoxLog | null }) {
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
  };
} else {
  StackTrace = function () {
    return <View style={{ flex: 1 }} />;
  };
}

function StandardErrorView({ error }: { error: Error }) {
  return (
    <View
      style={{
        marginBottom: 12,
        gap: 4,
        flexWrap: process.env.EXPO_OS === 'web' ? 'wrap' : 'nowrap',
      }}>
      <Text role="heading" aria-level={1} style={styles.title}>
        Something went wrong
      </Text>
      <Text testID="router_error_message" role="heading" aria-level={2} style={styles.errorMessage}>
        Error: {error.message}
      </Text>
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const logBoxLog = useMetroSymbolication(error);
  const inTabBar = useContext(BottomTabBarHeightContext);
  const Wrapper = inTabBar ? View : SafeAreaView;

  const isServerError = error instanceof ReactServerError;
  return (
    <View style={styles.container}>
      <Wrapper style={{ flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }}>
        {isServerError ? (
          <>
            <ReactServerErrorView error={error} />
            <View style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <StandardErrorView error={error} />
            <StackTrace logData={logBoxLog} />
          </>
        )}

        {process.env.NODE_ENV === 'development' && (
          <Link testID="router_error_sitemap" href="/_sitemap" style={styles.link}>
            Sitemap
          </Link>
        )}
        <Pressable testID="router_error_retry" onPress={retry}>
          {({ hovered, pressed }) => (
            <View
              style={[styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }]}>
              <Text
                style={[
                  styles.buttonText,
                  {
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

const COMMON_ERROR_STATUS = {
  404: 'NOT_FOUND',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

// TODO: This should probably be replaced by a DOM component that loads server errors in the future.
function ReactServerErrorView({ error }: { error: ReactServerError }) {
  let title = String(error.statusCode);
  title += ': ' + (COMMON_ERROR_STATUS[error.statusCode] ?? 'Server Error');

  const errorId = error.headers.get('cf-ray');

  const date = error.headers.get('Date');

  return (
    <View
      style={{
        padding: 12,
        gap: 8,
      }}>
      <Text
        selectable
        allowFontScaling
        style={{
          fontSize: Platform.select({ web: 24, default: 16 }),
          fontWeight: 'bold',
          marginBottom: 4,
          color: 'white',
        }}>
        {title}
      </Text>

      {process.env.EXPO_OS === 'web' ? (
        <ScrollView
          style={{
            borderColor: 'rgba(255,255,255,0.5)',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            maxHeight: 150,
          }}
          contentContainerStyle={{ paddingVertical: 4 }}>
          <Text
            selectable
            allowFontScaling
            style={{
              color: 'white',
            }}>
            {error.message}
          </Text>
        </ScrollView>
      ) : (
        <TextInput
          scrollEnabled
          multiline
          editable={false}
          allowFontScaling
          value={error.message}
          style={{
            borderColor: 'rgba(255,255,255,0.5)',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingVertical: 4,
            maxHeight: 150,
            color: 'white',
          }}
        />
      )}

      <InfoRow title="Code" right={error.statusCode} />
      {errorId && <InfoRow title="ID" right={errorId} />}
      {date && <InfoRow title="Date" right={date} />}

      {error.url && (
        <Text selectable allowFontScaling style={{ fontSize: 14, opacity: 0.5, color: 'white' }}>
          {error.url}
        </Text>
      )}
    </View>
  );
}

function InfoRow({ title, right }: { title: string; right?: any }) {
  const style = {
    fontSize: 16,
    color: 'white',
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text selectable allowFontScaling style={style}>
        {title}
      </Text>
      {right && (
        <Text selectable allowFontScaling style={[style, styles.code]}>
          {right}
        </Text>
      )}
    </View>
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
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
  },
  buttonInner: {
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
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
  errorMessage: {
    color: 'white',
    fontSize: 16,
  },
  subtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
  },
  link: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});
