import React from 'react';

import { View, DevSettings, Platform, Clipboard, type Modal as ModalInterface} from 'react-native';

import LogBoxPolyfillDOM from './logbox-polyfill-dom';

// @ts-ignore
import * as LogBoxData from 'react-native/Libraries/LogBox/Data/LogBoxData';
import { LogBoxLog } from './Data/LogBoxLog';

// @ts-ignore
import RCTModalHostView from 'react-native/Libraries/Modal/RCTModalHostViewNativeComponent';
import { isRunningInExpoGo } from 'expo';

const Modal = RCTModalHostView as typeof ModalInterface;

const Colors = {
  background: '#111113',
}

function LogBoxRNPolyfill(
  props: {
    onDismiss: (index: number) => void;
    onMinimize: () => void;
    onChangeSelectedIndex: (index: number) => void;
    logs: any[];
    selectedIndex: number;
  }
) {
  const logs = React.useMemo(() => {
    return props.logs.map((log) => {
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
  const bundledLogBoxUrl = getBundledLogBoxURL();

  return (
    <Modal
      // android
      hardwareAccelerated={true}
      // ios
      animationType="slide"
      presentationStyle="pageSheet"
      // common
      visible={open}
      onRequestClose={() => {
        setOpen(false);
        // changing the selected index to -1 will interfere with the slide down animation on iOS
        setTimeout(() => {
          props.onChangeSelectedIndex(-1);
        }, 500);
      }}
      >
        <View
          style={{
            backgroundColor: Platform.select({ default: undefined, ios: Colors.background }),
            pointerEvents: 'box-none',
            top: 0,
            flex: 1,
          }}
          collapsable={false}
        >
          <LogBoxPolyfillDOM
            platform={process.env.EXPO_OS}
            dom={{
              sourceOverride: bundledLogBoxUrl ? { uri: bundledLogBoxUrl } : undefined,
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
              bounces: true,
            }}
            fetchJsonAsync={async (input: RequestInfo, init?: RequestInit) => {
              try {
                const res = await fetch(input, init);
                const json = await res.json();
                return json;
              } catch (e) {
                throw e;
              }
            }}
            reloadRuntime={() => {
              DevSettings.reload();
            }}
            onCopyText={(text: string) => {
              // TODO: Export to helper and use DevServer to for host clipboard with fallback to device clipboard
              Clipboard.setString(text);
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

function _LogBoxInspectorContainer({
  selectedLogIndex,
  logs
}: {
    logs: LogBoxLog[],
    selectedLogIndex: number,
    isDisabled?: boolean,
}) {
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

  const _handleSetSelectedLog = (index: number) => {
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
}

let cachedBundledLogBoxUrl: string | null | undefined = undefined;
/**
 * Get the base URL for the Expo LogBox Prebuilt DOM Component HTML
 */
function getBundledLogBoxURL(): string | null {
  if (cachedBundledLogBoxUrl !== undefined) {
    return cachedBundledLogBoxUrl;
  }

  if (isRunningInExpoGo()) {
    // TODO: This will require a new version of Expo Go with the prebuilt Expo LogBox DOM Components
    cachedBundledLogBoxUrl = null;
    return null;
  }

  // Serving prebuilt from application bundle
  if (process.env.EXPO_OS === 'android') {
    cachedBundledLogBoxUrl = 'file:///android_asset/ExpoLogBox.bundle/index.html';
  } else if (process.env.EXPO_OS === 'ios') {
    cachedBundledLogBoxUrl = 'ExpoLogBox.bundle/index.html';
  } else {
    // Other platforms do not support the bundled LogBox DOM Component
    cachedBundledLogBoxUrl = null;
  }

  return cachedBundledLogBoxUrl;
}

export default LogBoxData.withSubscription(_LogBoxInspectorContainer);
