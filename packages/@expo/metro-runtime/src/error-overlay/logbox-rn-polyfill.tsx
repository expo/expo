import React from 'react';

import { View, StyleSheet, Modal } from 'react-native';

import LogBoxPolyfillDOM from '@expo/metro-runtime/src/error-overlay/logbox-polyfill-dom';

import * as LogBoxData from 'react-native/Libraries/LogBox/Data/LogBoxData';

function LogBoxRNPolyfill(props: {
  onDismiss: (index: number) => void;
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
        symbolicated: log.symbolicated,
        symbolicatedComponentStack: log.symbolicatedComponentStack,
        componentCodeFrame: log.componentCodeFrame,
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

  const [open, setOpen] = React.useState(true);
  // console.log('LogBoxRNPolyfill.logs', JSON.stringify(logs));
  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={open}
      style={{ backgroundColor: 'rgba(28.05, 28.05, 30.6, 1)' }}
      onRequestClose={() => {
        setOpen(false);
        console.log('LogBoxRNPolyfill.onDismiss');
        setTimeout(() => {
          props.onChangeSelectedIndex(-1);
        }, 100);
      }}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'black',
            // backgroundColor: 'rgba(255,0,0,0.2)',
            pointerEvents: 'box-none',
          },
        ]}>
        <LogBoxPolyfillDOM
          platform={process.env.EXPO_OS}
          dom={{
            contentInsetAdjustmentBehavior: 'never',
            containerStyle: {
              pointerEvents: 'box-none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            style: {
              flex: 1,
            },
            suppressMenuItems: ['underline', 'lookup', 'translate'],
            // menuItems: [
            //   {
            //     label: 'Copy',
            //     key: 'copy',
            //   },
            //   {
            //     label: '𝝠 Expo',
            //     key: 'expo',
            //   },
            //   {
            //     label: 'Share',
            //     key: 'share',
            //   },
            // ],
            // onCustomMenuSelection(event) {

            // },
            bounces: true,
          }}
          fetchJsonAsync={async (input: RequestInfo, init?: RequestInit) => {
            try {
              // console.log('fetchJsonAsync', input, init);
              const res = await fetch(input, init);
              const json = await res.json();
              // console.log('fetchJsonAsync.res', json);
              return json;
            } catch (e) {
              // console.log('fetchJsonAsync.error', e);
              throw e;
            }
          }}
          onCopyText={(text: string) => {
            require('react-native').Clipboard.setString(text);
          }}
          onDismiss={props.onDismiss}
          onMinimize={props.onMinimize}
          onChangeSelectedIndex={props.onChangeSelectedIndex}
          selectedIndex={props.selectedIndex}
          logs={logs}
        />
      </View>
    </Modal>
  );
}

function _LogBoxInspectorContainer({ selectedLogIndex, logs }) {
  const _handleDismiss = (index: number) => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    console.log('LogBoxInspectorContainer._handleDismiss');
    const logsArray = Array.from(logs);
    // if (selectedLogIndex != null) {
    //   if (logsArray.length - 1 <= 0) {
    //     LogBoxData.setSelectedLog(-1);
    //   } else if (selectedLogIndex >= logsArray.length - 1) {
    //     LogBoxData.setSelectedLog(selectedLogIndex - 1);
    //   }

    //   LogBoxData.dismiss(logsArray[selectedLogIndex]);
    // }
    LogBoxData.dismiss(logsArray[index]);
  };

  const _handleMinimize = () => {
    console.log('LogBoxInspectorContainer._handleMinimize');
    LogBoxData.setSelectedLog(-1);
  };

  const _handleSetSelectedLog = (index) => {
    console.log('LogBoxInspectorContainer._handleSetSelectedLog');

    LogBoxData.setSelectedLog(index);
  };

  if (selectedLogIndex < 0) {
    return null;
  }

  return (
    <LogBoxRNPolyfill
      onDismiss={_handleDismiss}
      onMinimize={_handleMinimize}
      onChangeSelectedIndex={_handleSetSelectedLog}
      logs={logs}
      selectedIndex={selectedLogIndex}
    />
  );
  //   return (
  //     <View style={StyleSheet.absoluteFill}>
  //       <LogBoxInspector
  //         onDismiss={_handleDismiss}
  //         onMinimize={_handleMinimize}
  //         onChangeSelectedIndex={_handleSetSelectedLog}
  //         logs={props.logs}
  //         selectedIndex={props.selectedLogIndex}
  //       />
  //     </View>
  //   );
}

export default LogBoxData.withSubscription(_LogBoxInspectorContainer);
