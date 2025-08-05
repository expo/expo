'use client';

import { nanoid } from 'nanoid/non-secure';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';

import { ModalPortalHost, PortalContext, PortalContextProvider } from './Portal';
import type { ModalConfig, ModalsRendererProps } from './types';
import { getStackAnimationType, getStackPresentationType } from './utils';

export const ModalsRenderer = ({
  children,
  modalConfigs,
  onDismissed,
  onShow,
}: ModalsRendererProps) => {
  const rootId = useRef(nanoid());
  // This will be used as a baseline for calculating the content offset.
  // Modal can have at most the same height as the host screen.
  const [hostScreenHeight, setHostScreenHeight] = useState(0);

  return (
    <PortalContextProvider hostScreenHeight={hostScreenHeight}>
      <ScreenStack style={styles.stackContainer}>
        <ScreenStackItem
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height) {
              setHostScreenHeight(height);
            }
          }}
          screenId={rootId.current}
          activityState={2}
          style={StyleSheet.absoluteFill}
          headerConfig={{
            hidden: true,
          }}>
          {children}
        </ScreenStackItem>
        {modalConfigs.map((config) => (
          <NativeModal
            key={config.uniqueId}
            config={config}
            onDismissed={onDismissed}
            onShow={onShow}
          />
        ))}
      </ScreenStack>
    </PortalContextProvider>
  );
};

interface NativeModalProps {
  config: ModalConfig;
  onDismissed?: (id: string) => void;
  onShow?: (id: string) => void;
}

function NativeModal({ config, onDismissed, onShow }: NativeModalProps) {
  const stackPresentation = getStackPresentationType(config);
  const stackAnimation = getStackAnimationType(config);

  const shouldUseContentHeight =
    stackPresentation === 'formSheet' &&
    (process.env.EXPO_OS === 'ios' || config.detents === 'fitToContents');
  const [activityState, setActivityState] = useState<0 | 2>(0);
  const isRegistered = useRef(false);
  const hadLayout = useRef(false);

  const { getHost } = use(PortalContext);
  const hostConfig = getHost(config.uniqueId);

  const maybeShowModal = useCallback(() => {
    // We only want to show the modal if it is registered and has layout
    // Otherwise, layout glitches can occur
    if (
      isRegistered.current &&
      hadLayout.current &&
      (!hostConfig?.shouldUseContentHeight || hostConfig?.contentSize?.height)
    ) {
      setActivityState(2);
    }
  }, [hostConfig?.contentSize?.height, hostConfig?.shouldUseContentHeight]);

  useEffect(() => {
    maybeShowModal();
  }, [maybeShowModal]);

  const [fullScreenHeight, setFullScreenHeight] = useState(0);
  const [currentDetentIndex, setCurrentDetentIndex] = useState<number | undefined>(undefined);

  const height =
    Array.isArray(config.detents) && config.detents.length
      ? fullScreenHeight * config.detents[currentDetentIndex ?? 0]
      : fullScreenHeight;

  return (
    <ScreenStackItem
      key={config.uniqueId}
      {...config.viewProps}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height) {
          setFullScreenHeight(height);
        }
      }}
      screenId={`__modal-${config.uniqueId}`}
      activityState={activityState}
      stackPresentation={stackPresentation}
      stackAnimation={stackAnimation}
      nativeBackButtonDismissalEnabled
      headerConfig={{
        hidden: true,
      }}
      contentStyle={[
        {
          backgroundColor: config.transparent ? 'transparent' : 'white',
        },
        config.viewProps?.style,
      ]}
      sheetAllowedDetents={config.detents}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: config.transparent ? 'transparent' : 'white',
        },
      ]}
      onSheetDetentChanged={(event) => {
        const { nativeEvent } = event;
        const { index } = nativeEvent;
        setCurrentDetentIndex(index);
      }}
      onDismissed={() => {
        onDismissed?.(config.uniqueId);
      }}
      onAppear={() => {
        onShow?.(config.uniqueId);
      }}>
      <ModalPortalHost
        hostId={config.uniqueId}
        style={{
          width: '100%',
        }}
        height={height}
        useContentHeight={shouldUseContentHeight}
        onLayout={() => {
          hadLayout.current = true;
          maybeShowModal();
        }}
        onRegistered={() => {
          isRegistered.current = true;
          maybeShowModal();
        }}
      />
    </ScreenStackItem>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
  },
});
