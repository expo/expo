import * as Cellular from 'expo-cellular';
import * as React from 'react';
import { ScrollView } from 'react-native';

import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function CellularScreen() {
  const [generation, error] = useResolvedValue(Cellular.getCellularGenerationAsync);

  React.useEffect(() => {
    if (error) alert(error.message);
  }, [error]);

  return (
    <ScrollView style={{ padding: 10 }}>
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
};
