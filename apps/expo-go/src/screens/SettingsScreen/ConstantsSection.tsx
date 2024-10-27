import Constants from 'expo-constants';
import { View, Divider } from 'expo-dev-client-components';
import * as React from 'react';
import { Clipboard, Alert } from 'react-native';

import { ConstantItem } from '../../components/ConstantItem';
import { SectionHeader } from '../../components/SectionHeader';
import Environment from '../../utils/Environment';

export function ConstantsSection() {
  const copyClientVersionToClipboard = () => {
    if (Constants.expoVersion) {
      Clipboard.setString(Constants.expoVersion);
      Alert.alert('Clipboard', `The app's version has been copied to your clipboard.`);
    } else {
      // this should not ever happen
      Alert.alert('Clipboard', `Something went wrong - the app's version is not available.`);
    }
  };

  return (
    <View>
      <SectionHeader header="App Info" />
      <View bg="default" border="default" overflow="hidden" rounded="large">
        {Constants.expoVersion ? (
          <>
            <ConstantItem
              title="Client version"
              value={Constants.expoVersion}
              onPress={copyClientVersionToClipboard}
            />
            <Divider style={{ height: 1 }} />
          </>
        ) : null}
        <ConstantItem title="Supported SDK" value={Environment.supportedSdksString} />
      </View>
    </View>
  );
}
