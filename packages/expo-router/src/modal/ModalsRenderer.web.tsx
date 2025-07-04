'use client';

import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { ModalComponent } from './ModalComponent';
import type { ModalConfig, ModalsRendererProps } from './types';
import { getStackAnimationType, getStackPresentationType } from './utils';
import { ModalStackRouteDrawer } from './web/ModalStackRouteDrawer.web';
// TODO: think about better approach. This is transitive dependency from vaul
import { Portal } from '@radix-ui/react-portal';

export const ModalsRenderer = ({
  children,
  modalConfigs,
  onDismissed,
  onShow,
}: ModalsRendererProps) => {
  return (
    <div style={{ flex: 1, display: 'flex' }}>
      {children}
      {modalConfigs.map((config) => (
        <Modal
          key={config.uniqueId}
          config={config}
          onDismissed={() => onDismissed?.(config.uniqueId)}
        />
      ))}
    </div>
  );
};

interface ModalProps {
  config: ModalConfig;
  onDismissed: () => void;
}

function Modal({ config, onDismissed }: ModalProps) {
  const { colors } = useTheme();

  const presentation = getStackPresentationType(config);

  if (presentation === 'transparentModal' || presentation === 'fullScreenModal') {
    return (
      <Portal>
        <View style={StyleSheet.absoluteFill}>
          <View
            {...config.viewProps}
            style={[{ flex: 1, backgroundColor: colors.background }, config.viewProps?.style]}>
            <ModalComponent modalConfig={config} />
          </View>
        </View>
      </Portal>
    );
  }

  return (
    <ModalStackRouteDrawer
      routeKey={config.uniqueId}
      onDismiss={onDismissed}
      themeColors={colors}
      key={config.uniqueId}
      options={{
        presentation: getStackPresentationType(config),
        animation: getStackAnimationType(config),
        headerShown: false,
        sheetAllowedDetents: config.detents,
      }}
      renderScreen={() => (
        <View style={{ width: '100%', height: '100%' }}>
          <View {...config.viewProps} style={[{ flex: 1 }, config.viewProps?.style]}>
            <ModalComponent modalConfig={config} />
          </View>
        </View>
      )}
    />
  );
}
