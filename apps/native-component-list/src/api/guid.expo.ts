import { Platform } from 'react-native';

export function getGUID(): string {
  const map = {
    ios: '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln',
    android: '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
  };
  const GUID = Platform.select<string>(map);
  if (!GUID)
    throw new Error(
      `No valid GUID for Expo client on platform: ${
        Platform.OS
      }. Supported native platforms are currently: ${Object.keys(map).join(', ')}`
    );
  return GUID;
}
