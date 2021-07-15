import * as Cellular from 'expo-cellular';
import { CellularInfo } from 'expo-cellular/build/Cellular.types';
import { PermissionResponse } from 'expo-modules-core';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function CellularScreen() {
  const [permissions, setPermissions] = useState<PermissionResponse>();
  const [_, error] = useResolvedValue(Cellular.getCellularGenerationAsync, [permissions]);
  const [cellularInfo, setCellularInfo] = useState<CellularInfo>();

  React.useEffect(() => {
    if (error) alert(error.message);
  }, [error]);

  const _requestPermissions = async () => {
    try {
      const newPermissions = await Cellular.requestPhoneStatePermissionsAsync();
      setPermissions(newPermissions);
    } catch (error) {
      alert(error.message);
    }
  };

  const _getCellularInfo = async () => {
    const newCellularCarrier = await Cellular.getCurrentCarrierAsync();
    setCellularInfo(newCellularCarrier);
  };

  return (
    <ScrollView style={{ padding: 10 }}>
      <Button
        onPress={_requestPermissions}
        title="Request phone permissions"
        style={{ padding: 10 }}
      />
      <Button onPress={_getCellularInfo} title="Get cellular information" style={{ padding: 10 }} />
      {cellularInfo ? (
        <MonoText>
          {JSON.stringify(
            {
              allowsVoip: cellularInfo.allowsVoip,
              carrier: cellularInfo.carrier,
              isoCountryCode: cellularInfo.isoCountryCode,
              mobileCountryCode: cellularInfo.mobileCountryCode,
              mobileNetworkCode: cellularInfo.mobileNetworkCode,
              generation: cellularInfo.generation,
              generationName: generationMap[cellularInfo.generation ?? 0],
            },
            null,
            2
          )}
        </MonoText>
      ) : null}
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
