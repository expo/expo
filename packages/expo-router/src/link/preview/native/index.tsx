import { Text } from 'react-native';

import {
  PeekAndPopPreviewViewProps,
  PeekAndPopTriggerViewProps,
  PeekAndPopViewProps,
} from './types';

const NotAvailableOnThisPlatformComponent = () => {
  console.warn('Peek and pop preview is only available on iOS');
  return <Text style={{ color: 'red' }}>Peek and pop preview is only available on iOS</Text>;
};

export const PeekAndPopView = (_: PeekAndPopViewProps) => NotAvailableOnThisPlatformComponent();
export const PeekAndPopPreviewView = (_: PeekAndPopPreviewViewProps) =>
  NotAvailableOnThisPlatformComponent();
export const PeekAndPopTriggerView = (_: PeekAndPopTriggerViewProps) =>
  NotAvailableOnThisPlatformComponent();
