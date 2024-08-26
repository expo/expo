import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps } from 'react-native';

interface AccessButtonProps extends ViewProps {
  queryString: string;
  padding?: number;
}

export const ContactsAccessButton = requireNativeViewManager<AccessButtonProps>('ExpoContacts');
