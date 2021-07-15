import * as Cellular from 'expo-cellular';
import { PermissionResponse } from 'expo-modules-core';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function CellularScreen() {
  const [permissions, setPermissions] = useState<PermissionResponse>();
  const [generation, error] = useResolvedValue(Cellular.getCellularGenerationAsync, [permissions]);

  React.useEffect(() => {
    if (error) alert(error.message);
  }, [error]);

  const _requestPermissions = async () => {
    const newPermissions = await Cellular.requestPhoneStatePermissionsAsync();
    setPermissions(newPermissions);
  };

  return (
    <ScrollView style={{ padding: 10 }}>
      <Button onPress={_requestPermissions} title="Request phone permissions" />
      <MonoText>
        {JSON.stringify(
          {
            allowsVoip: Cellular.allowsVoip,
            carrier: Cellular.carrier,
            isoCountryCode: Cellular.isoCountryCode,
            mobileCountryCode: Cellular.mobileCountryCode,
            mobileNetworkCode: Cellular.mobileNetworkCode,
            generation,
            generationName: generationMap[generation ?? 0],
          },
          null,
          2
        )}
      </MonoText>
    </ScrollView>
  );
}

const generationMap = {
  [Cellular.CellularGeneration.UNKNOWN]: 'unknown',
  [Cellular.CellularGeneration.CELLULAR_2G]: '2G',
  [Cellular.CellularGeneration.CELLULAR_3G]: '3G',
  [Cellular.CellularGeneration.CELLULAR_4G]: '4G',
  [Cellular.CellularGeneration.CELLULAR_5G]: '5G',
};
