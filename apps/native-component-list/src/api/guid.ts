import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const map = {
  ios: {
    // bare-expo
    'dev.expo.Payments': '29635966244-v8mbqt2mtno71thelt7f2i6pob104f6e',
    // NCL standalone
    [Constants.manifest.ios?.bundleIdentifier]: '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln',
  },
  android: {
    // bare-expo
    'dev.expo.payments': '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
    // NCL standalone
    [Constants.manifest.android?.package]: '29635966244-eql85q7fpnjncjcp6o3t3n98mgeeklc9',
  },
};
const GUIDs = Platform.select<Record<string, string>>(map);

export function getGUID(): string {
  // This should only happen
  if (!GUIDs) {
    throw new Error(
      `No valid GUID for bare projects on platform: ${
        Platform.OS
      }. Supported native platforms are currently: ${Object.keys(map).join(', ')}`
    );
  }

  if (!Application.applicationId) {
    throw new Error('Cannot get GUID with null `Application.applicationId`');
  }
  if (!(Application.applicationId in GUIDs)) {
    throw new Error(
      `No valid GUID for native app Id: ${Application.applicationId}. Valid GUIDs exist for ${
        Platform.OS
      } projects with native Id: ${Object.keys(GUIDs).join(', ')}`
    );
  }
  return GUIDs[Application.applicationId];
}
