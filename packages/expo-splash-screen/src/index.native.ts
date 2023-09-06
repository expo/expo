import { requireNativeModule } from 'expo-modules-core';

const SplashScreen = requireNativeModule('ExpoSplashScreen');

export const preventAutoHideAsync: () => Promise<boolean> = SplashScreen.preventAutoHideAsync;

export const hideAsync: () => Promise<boolean> = SplashScreen.hideAsync;
