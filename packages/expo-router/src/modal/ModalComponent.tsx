import { NavigationContext } from '@react-navigation/native';
import { useCallback } from 'react';
import { View } from 'react-native';

import { useModalContext } from './ModalContext';
import { useFocusEffect } from '../useFocusEffect';

export function ModalComponent() {
  const { modalConfig, closeModal } = useModalContext();
  const component = modalConfig?.component;
  const navigationProp = modalConfig?.navigationProp;

  useFocusEffect(
    useCallback(() => {
      return () => closeModal(true);
    }, [closeModal])
  );

  if (navigationProp) {
    return (
      <NavigationContext value={navigationProp}>
        <View style={{ flex: 1 }}>{component}</View>
      </NavigationContext>
    );
  }
  return <View style={{ flex: 1 }}>{component}</View>;
}
