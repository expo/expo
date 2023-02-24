import * as Cellular from 'expo-cellular';
import { CellularGeneration } from 'expo-cellular';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';

type CellularInfo = {
  allowsVoip: boolean | null;
  carrier: string | null;
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  generation: CellularGeneration;
};

export default function CellularScreen() {
  const [cellularInfo, setCellularInfo] = useState<CellularInfo>();

  const _getCellularInfo = async () => {
    try {
      const response = await Cellular.requestPermissionsAsync();
      if (!response.granted) {
        console.warn(
          "getCurrentGeneration will return unknown, becuase the phone state permission wasn't granted."
        );
      }
      const generation = await Cellular.getCellularGenerationAsync();
      setCellularInfo({
        allowsVoip: await Cellular.allowsVoipAsync(),
        carrier: await Cellular.getCarrierNameAsync(),
        isoCountryCode: await Cellular.getIsoCountryCodeAsync(),
        mobileCountryCode: await Cellular.getMobileCountryCodeAsync(),
        mobileNetworkCode: await Cellular.getMobileNetworkCodeAsync(),
        generation,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <ScrollView style={{ padding: 10 }}>
      <Button onPress={_getCellularInfo} title="Get cellular information" style={{ padding: 10 }} />
      {cellularInfo ? (
        <MonoText>
          {JSON.stringify(
            {
              ...cellularInfo,
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
