import * as Application from 'expo-application';
import { Platform } from 'react-native';

const GUIDs = Platform.select<Record<string, string>>({
  ios: {
    // bare-expo
    'dev.expo.Payments': '29635966244-v8mbqt2mtno71thelt7f2i6pob104f6e',
  },
  android: {
    // bare-expo
    'dev.expo.payments': '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
  },
});

export function getGUID(): string {
  if (!Application.applicationId)
    throw new Error('Cannot get GUID with null `Application.applicationId`');
  if (!(Application.applicationId in GUIDs)) {
    throw new Error(
      `No valid GUID for native app Id: ${Application.applicationId}. Valid GUIDs exist for ${
        Platform.OS
      } projects with native Id: ${Object.keys(GUIDs).join(', ')}`
    );
  }
  return GUIDs[Application.applicationId];
}
