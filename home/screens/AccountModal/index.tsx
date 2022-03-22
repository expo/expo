import { View } from 'expo-dev-client-components';
import React from 'react';
import { Platform } from 'react-native';

import { ModalHeader } from './ModalHeader';

export function AccountModal() {
  return <View flex="1">{Platform.OS === 'ios' && <ModalHeader />}</View>;
}
