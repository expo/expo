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

  return (
    <PortalContextProvider>
      <ScreenStack style={styles.stackContainer}>
        <ScreenStackItem
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

  const shouldUseContentHeight = stackPresentation === 'formSheet';
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

  return (
    <ScreenStackItem
      key={config.uniqueId}
      {...config.viewProps}
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
          height: '100%',
        }}
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
