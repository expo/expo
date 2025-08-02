'use client';

import { useTheme } from '@react-navigation/native';
import { View } from 'react-native';

import type { ModalConfig, ModalsRendererProps } from './types';
import { getStackAnimationType, getStackPresentationType } from './utils';
import { ModalStackRouteDrawer } from './web/ModalStackRouteDrawer.web';
import { TransparentModalStackRouteDrawer } from './web/TransparentModalStackRouteDrawer.web';
import { isTransparentModalPresentation } from './web/utils';

export const ModalsRenderer = ({ children, modalConfigs, onDismissed }: ModalsRendererProps) => {
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
  const isTransparentModal = isTransparentModalPresentation({ presentation });

  const SelectedModalComponent = isTransparentModal
    ? TransparentModalStackRouteDrawer
    : ModalStackRouteDrawer;

  return (
    <SelectedModalComponent
      routeKey={config.uniqueId}
      onDismiss={onDismissed}
      themeColors={colors}
      key={config.uniqueId}
      options={{
        presentation,
        animation: getStackAnimationType(config),
        headerShown: false,
        sheetAllowedDetents: config.detents,
      }}
      renderScreen={() => (
        <View style={{ flex: 1 }}>
          <View {...config.viewProps} style={[{ flex: 1 }, config.viewProps?.style]}>
            {config.component}
          </View>
        </View>
      )}
    />
  );
}
