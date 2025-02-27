import Constants from 'expo-constants';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

const hasViewControllerBasedStatusBarAppearance =
  process.env.EXPO_OS === 'ios' &&
  !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;

export const canOverrideStatusBarBehavior =
  !isEdgeToEdge() && !hasViewControllerBasedStatusBarAppearance;
