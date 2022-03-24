import { DevLauncherExtension } from 'expo-dev-launcher';
import { NativeModules } from 'react-native';

export const isDevLauncherInstalled = NativeModules.EXDevLauncherExtension != null;
export const DevLauncher = NativeModules.EXDevLauncherExtension as DevLauncherExtension;
