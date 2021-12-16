import { NativeModules } from 'react-native';

const DevMenu = NativeModules.ExpoDevMenu;

export async function queryDevSessionsAsync(deviceID?: string): Promise<any> {
  return await DevMenu.queryDevSessionsAsync(deviceID ?? null);
}
