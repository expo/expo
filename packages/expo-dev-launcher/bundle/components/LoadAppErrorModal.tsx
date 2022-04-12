import { Text } from 'expo-dev-client-components';
import * as React from 'react';

import { BaseModal } from './BaseModal';

export function LoadAppErrorModal({ message }) {
  return (
    <BaseModal title="Error loading app">
      <Text>{message}</Text>
    </BaseModal>
  );
}
