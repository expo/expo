import { View, StyleSheet } from 'react-native';

import LogBoxExpo from '@expo/metro-runtime/src/error-overlay/logbox-polyfill-dom';

export default function LogBoxRNPolyfill(props: {
  onDismiss: () => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LogBoxExpo
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
        onDismiss={props.onDismiss}
        onMinimize={props.onMinimize}
        onChangeSelectedIndex={props.onChangeSelectedIndex}
        selectedIndex={props.selectedIndex}
        logs={props.logs.map((log) => {
          console.log('LOG:', Object.keys(log));

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
        })}
      />
    </View>
  );
}
