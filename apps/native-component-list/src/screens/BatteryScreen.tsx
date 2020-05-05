import * as Battery from 'expo-battery';
import * as React from 'react';
import { ScrollView } from 'react-native';

import MonoText from '../components/MonoText';

export default function BatteryScreen() {
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);
  const [batteryLevel, setBatteryLevel] = React.useState(-1);
  const [batteryState, setBatteryState] = React.useState(Battery.BatteryState.UNKNOWN);
  const [lowPowerMode, setLowPowerMode] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [isAvailable, batteryLevel, batteryState, lowPowerMode] = await Promise.all([
        Battery.isAvailableAsync(),
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync(),
      ]);

      setIsAvailable(isAvailable || false);
      setBatteryLevel(batteryLevel);
      setBatteryState(batteryState);
      setLowPowerMode(lowPowerMode);
    })();
    const batteryLevelListener = Battery.addBatteryLevelListener(({ batteryLevel }) =>
      setBatteryLevel(batteryLevel)
    );
    const batteryStateListener = Battery.addBatteryStateListener(({ batteryState }) =>
      setBatteryState(batteryState)
    );
    const lowPowerModeListener = Battery.addLowPowerModeListener(({ lowPowerMode }) =>
      setLowPowerMode(lowPowerMode)
    );
    return () => {
      batteryLevelListener && batteryLevelListener.remove();
      batteryStateListener && batteryStateListener.remove();
      lowPowerModeListener && lowPowerModeListener.remove();
    };
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      <MonoText>
        {isAvailable
          ? JSON.stringify(
              {
                batteryLevel,
                batteryState: getBatteryStateString(batteryState),
                lowPowerMode,
              },
              null,
              2
            )
          : 'Battery API is not supported on this device'}
      </MonoText>
    </ScrollView>
  );
}

BatteryScreen.navigationOptions = {
  title: 'Battery',
};

function getBatteryStateString(batteryState: Battery.BatteryState): string {
  switch (batteryState) {
    case Battery.BatteryState.UNPLUGGED:
      return 'UNPLUGGED';
    case Battery.BatteryState.CHARGING:
      return 'CHARGING';
    case Battery.BatteryState.FULL:
      return 'FULL';
    case Battery.BatteryState.UNKNOWN:
    default:
      return 'UNKNOWN';
  }
}
