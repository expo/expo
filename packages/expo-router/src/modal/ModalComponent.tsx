import { NavigationContext } from '@react-navigation/native';
import { View } from 'react-native';

import { type ModalConfig } from './ModalContext';

interface ModalComponentProps {
  modalConfig: ModalConfig;
}

export function ModalComponent({ modalConfig }: ModalComponentProps) {
  const component = modalConfig.component;
  const navigationProp = modalConfig.parentNavigationProp;

  if (navigationProp) {
    return (
      <NavigationContext value={navigationProp}>
        <View style={{ flex: 1 }}>{component}</View>
      </NavigationContext>
    );
  }
  return <View style={{ flex: 1 }}>{component}</View>;
}
