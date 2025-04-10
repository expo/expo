import React from 'react';

import { View, StyleSheet } from 'react-native';

import LogBoxExpo from '@expo/metro-runtime/src/error-overlay/logbox-polyfill-dom';

export default function LogBoxRNPolyfill(props: {
  onDismiss: () => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
}) {
  const logs = React.useMemo(() => {
    return props.logs.map((log) => {
      // console.log('LOG:', Object.keys(log));

      //   LOG  LOG: ["symbolicated", "symbolicatedComponentStack", "level", "type", "message", "stack", "category", "componentStack", "componentStackType", "codeFrame", "isComponentError", "extraData", "count", "onNotificationPress"]

      //  TODO: Serialize
      return {
        level: log.level,
        type: log.type,
        message: log.message,
        stack: log.stack,
        category: log.category,
        componentStack: log.componentStack,
        componentStackType: log.componentStackType,
        codeFrame: log.codeFrame,
        isComponentError: log.isComponentError,
        extraData: log.extraData,
        count: log.count,
      };
    });
  }, [props.logs]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
      <LogBoxExpo
        platform={process.env.EXPO_OS}
        dom={{
          contentInsetAdjustmentBehavior: 'never',
          containerStyle: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          style: {
            flex: 1,
          },
        }}
        fetchJsonAsync={async (input: RequestInfo, init?: RequestInit) => {
          try {
            console.log('fetchJsonAsync', input, init);
            const res = await fetch(input, init);
            const json = await res.json();
            console.log('fetchJsonAsync.res', json);
            return json;
          } catch (e) {
            console.log('fetchJsonAsync.error', e);
            throw e;
          }
        }}
        onDismiss={props.onDismiss}
        onMinimize={props.onMinimize}
        onChangeSelectedIndex={props.onChangeSelectedIndex}
        selectedIndex={props.selectedIndex}
        logs={logs}
      />
    </View>
  );
}
