import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const hasViewControllerBasedStatusBarAppearance =
  Platform.OS === 'ios' &&
  !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
