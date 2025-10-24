import { isRunningInExpoGo } from 'expo';
import React, { useMemo } from 'react';
import { View, DevSettings, Platform, Clipboard, type Modal as ModalInterface } from 'react-native';
// @ts-ignore
import * as LogBoxData from 'react-native/Libraries/LogBox/Data/LogBoxData';
// @ts-ignore
import type LogBoxLog from 'react-native/Libraries/LogBox/Data/LogBoxLog';
// @ts-ignore
import RCTModalHostView from 'react-native/Libraries/Modal/RCTModalHostViewNativeComponent';

import LogBoxPolyfillDOM from './logbox-dom-polyfill';
import { getBaseUrl } from './utils/devServerEndpoints';

const Modal = RCTModalHostView as typeof ModalInterface;

const Colors = {
  background: '#111113',
};

function LogBoxRNPolyfill(props: {
  onDismiss: (index: number) => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
}) {
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

  const closeModal = (cb: () => void) => {
    setOpen(false);
    setTimeout(
      cb,
      Platform.select({
        ios: 500, // To allow the native modal to slide away before unmounting
        default: 0, // Android has no animation, Web has css animation which doesn't require the delay
      })
    );
  };

  const onMinimize = () => closeModal(props.onMinimize);
  const onDismiss = props.onDismiss;

  const LogBoxWrapper = useMemo(
    () =>
      Platform.OS === 'ios'
        ? ({ children, open }: { children?: React.ReactNode; open: boolean }) => {
            return (
              <Modal
                animationType="slide"
                presentationStyle="pageSheet"
                visible={open}
                onRequestClose={onMinimize}>
                {children}
              </Modal>
            );
          }
        : ({ children }: { children?: React.ReactNode; open: boolean }) => <>{children}</>,
    []
  );

  return (
    <LogBoxWrapper open={open}>
      <View
        style={{
          backgroundColor: Platform.select({ default: undefined, ios: Colors.background }),
          pointerEvents: 'box-none',
          top: 0,
          flex: 1,
        }}
        collapsable={false}>
        <LogBoxPolyfillDOM
          selectedIndex={props.selectedIndex}
          logs={logs}
          // LogBoxData actions props
          onDismiss={onDismiss}
          onChangeSelectedIndex={props.onChangeSelectedIndex}
          // Environment polyfill props
          devServerUrl={getBaseUrl()}
          // Common actions props
          fetchTextAsync={async (input, init) => {
            const res = await fetch(input, init);
            return res.text();
          }}
          // LogBox UI actions props
          onMinimize={onMinimize}
          onReload={() => {
            // NOTE: For iOS only the reload is enough, but on Android the app gets stuck on an empty black screen
            onMinimize();
            setTimeout(() => {
              DevSettings.reload();
            }, 100);
          }}
          onCopyText={(text: string) => {
            Clipboard.setString(text);
          }}
          // DOM props
          dom={{
            useExpoDOMWebView: true,
            overrideUri: bundledLogBoxUrl,
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
            overScrollMode: 'never',
          }}
        />
      </View>
    </LogBoxWrapper>
  );
}

function LogBoxInspectorContainer({
  selectedLogIndex,
  logs,
}: {
  logs: readonly LogBoxLog[];
  selectedLogIndex: number;
  isDisabled?: boolean;
}) {
  const handleDismiss = (index: number) => {
    LogBoxData.dismiss(logs[index]);
  };

  const handleMinimize = () => {
    LogBoxData.setSelectedLog(-1);
  };

  const handleSetSelectedLog = (index: number) => {
    LogBoxData.setSelectedLog(index);
  };

  if (selectedLogIndex < 0) {
    return null;
  }

  return (
    <LogBoxRNPolyfill
      onDismiss={handleDismiss}
      onMinimize={handleMinimize}
      onChangeSelectedIndex={handleSetSelectedLog}
      logs={logs as LogBoxLog[]}
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

export default LogBoxData.withSubscription(LogBoxInspectorContainer);
