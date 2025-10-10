import { isRunningInExpoGo } from 'expo';
import React, { useMemo } from 'react';
import { View, DevSettings, Platform, Clipboard, type Modal as ModalInterface } from 'react-native';
// @ts-ignore
import * as LogBoxData from 'react-native/Libraries/LogBox/Data/LogBoxData';
// @ts-ignore
import RCTModalHostView from 'react-native/Libraries/Modal/RCTModalHostViewNativeComponent';

import { LogBoxLog } from './Data/LogBoxLog';
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
    setTimeout(cb, Platform.select({ ios: 500, default: 0 }));
  };

  const onMinimize = () => closeModal(props.onMinimize);
  const onDismiss = props.onDismiss;

  const LogBoxWrapper = useMemo(
    () =>
      Platform.OS === 'ios'
        ? ({ children }: { children: React.ReactNode }) => {
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
        : ({ children }: { children: React.ReactNode }) => <>{children}</>,
    []
  );

  return (
    <LogBoxWrapper>
      <View
        style={{
          backgroundColor: Platform.select({ default: undefined, ios: Colors.background }),
          pointerEvents: 'box-none',
          top: 0,
          flex: 1,
        }}
        collapsable={false}>
        <LogBoxPolyfillDOM
          platform={process.env.EXPO_OS}
          devServerUrl={getBaseUrl()}
          dom={{
            useExpoDOMWebView: true,
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
            overScrollMode: 'never',
          }}
          fetchJsonAsync={async (input, init) => {
            try {
              const res = await fetch(input, init);
              return await res.text();
            } catch (e) {
              throw e;
            }
          }}
          reloadRuntime={() => {
            // NOTE: For iOS only the reload is enough, but on Android the app gets stuck on an empty black screen
            onMinimize();
            setTimeout(() => {
              DevSettings.reload();
            }, 100);
          }}
          onCopyText={(text: string) => {
            Clipboard.setString(text);
          }}
          onDismiss={onDismiss}
          onMinimize={onMinimize}
          onChangeSelectedIndex={props.onChangeSelectedIndex}
          selectedIndex={props.selectedIndex}
          logs={logs}
        />
      </View>
    </LogBoxWrapper>
  );
}

function LogBoxInspectorContainer({
  selectedLogIndex,
  logs,
}: {
  logs: LogBoxLog[];
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

export default LogBoxData.withSubscription(LogBoxInspectorContainer);
