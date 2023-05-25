import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform, ScrollView, Image } from 'react-native';

import { Entypo } from '@expo/vector-icons';

const bareMap = {
  ios: {
    // bare-expo
    'dev.expo.Payments': '629683148649-uvkfsi3pckps3lc4mbc2mi7pna8pqej5',
    // NCL standalone
    'host.exp.nclexp': '29635966244-1vu5o3e9ucoh12ujlsjpn30kt3dbersv',
  },
  android: {
    // bare-expo
    'dev.expo.payments': '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
    // NCL standalone
    'host.exp.nclexp': '29635966244-lbejmv84iurcge3hn7fo6aapu953oivs',
  },
};
const BARE_GUIDs = Platform.select<Record<string, string>>(bareMap);

const managedMap = {
  ios: '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln',
  android: '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
};
const GUID = Platform.select<string>(managedMap);

export function getGUID(): string {
  if (['storeClient', 'standalone'].includes(Constants.executionEnvironment)) {
    if (!GUID)
      throw new Error(
        `No valid GUID for Expo Go on platform: ${
          Platform.OS
        }. Supported native platforms are currently: ${Object.keys(managedMap).join(', ')}`
      );
    return GUID;
  } else if (Constants.executionEnvironment === 'bare') {
    if (!BARE_GUIDs) {
      throw new Error(
        `No valid GUID for bare projects on platform: ${
          Platform.OS
        }. Supported native platforms are currently: ${Object.keys(bareMap).join(', ')}`
      );
    }

    if (!Application.applicationId) {
      throw new Error('Cannot get GUID with null `Application.applicationId`');
    }
    if (!(Application.applicationId in BARE_GUIDs)) {
      throw new Error(
        `No valid GUID for native app Id: ${Application.applicationId}. Valid GUIDs exist for ${
          Platform.OS
        } projects with native Id: ${Object.keys(BARE_GUIDs).join(', ')}`
      );
    }
    return BARE_GUIDs[Application.applicationId];
  } else {
    throw new Error(
      `No GUID available for executionEnvironment: ${Constants.executionEnvironment}`
    );
  }
}
