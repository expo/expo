import Constants from 'expo-constants';
import { Platform } from 'react-native';
// @ts-ignore
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

const hasViewControllerBasedStatusBarAppearance =
  Platform.OS === 'ios' &&
  !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;

export const canOverrideStatusBarBehavior =
  !isEdgeToEdge() && !hasViewControllerBasedStatusBarAppearance;
