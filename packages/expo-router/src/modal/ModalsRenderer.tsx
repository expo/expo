'use client';

import { nanoid } from 'nanoid/non-secure';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';

import { ModalComponent } from './ModalComponent';
import type { ModalsRendererProps } from './types';
import { getStackAnimationType, getStackPresentationType } from './utils';

export const ModalsRenderer = ({
  children,
  modalConfigs,
  onDismissed,
  onShow,
}: ModalsRendererProps) => {
  const rootId = useRef(nanoid());

  return (
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
        <ScreenStackItem
          key={config.uniqueId}
          {...config.viewProps}
          screenId={`${rootId}${config.uniqueId}`}
          activityState={2}
          stackPresentation={getStackPresentationType(config)}
          stackAnimation={getStackAnimationType(config)}
          nativeBackButtonDismissalEnabled
          headerConfig={{
            hidden: true,
          }}
          contentStyle={[
            {
              flex: 1,
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
          <ModalComponent modalConfig={config} />
        </ScreenStackItem>
      ))}
    </ScreenStack>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
  },
});
