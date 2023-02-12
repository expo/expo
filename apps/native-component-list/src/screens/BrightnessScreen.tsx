import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import { useResolvedValue } from '../utilities/useResolvedValue';

const brightnessTypes: string[] = ['Brightness', 'SystemBrightness'];

export default function BrightnessScreen() {
  const [isAvailable, error] = useResolvedValue(Brightness.isAvailableAsync);

  const warning = React.useMemo(() => {
    if (error) {
      return `An unknown error occurred while checking the API availability: ${error.message}`;
    } else if (isAvailable === null) {
      return 'Checking availability...';
    } else if (isAvailable === false) {
      return 'Brightness API is not available on this platform.';
    }
    return null;
  }, [error, isAvailable]);

  if (warning) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text>{warning}</Text>
      </View>
    );
  }

  return <BrightnessView />;
}

function BrightnessView() {
  const [brightness, setBrightness] = React.useState<number | null>(null);
  const [systemBrightness] = useResolvedValue(Brightness.getSystemBrightnessAsync);
  const [sliderBrightness, setSliderBrightness] = React.useState<Record<string, number>>({});

  const [systemBrightnessPermissionGranted, setSystemBrightnessPermissionGranted] =
    React.useState(false);

  React.useEffect(() => {
    async function initialize() {
      const { granted } = await Brightness.getPermissionsAsync();
      const brightness = await Brightness.getBrightnessAsync();
      setSystemBrightnessPermissionGranted(granted);
      setBrightness(brightness);
    }

    initialize();

    const brightnessLevelListener = Brightness.addBrightnessListener(({ brightness }) => {
      setBrightness(brightness);
    });

    return () => {
      brightnessLevelListener.remove();
    };
  }, []);

  function alertBrightnessAsync(type: string) {
    (type === 'Brightness'
      ? Brightness.getBrightnessAsync()
      : Brightness.getSystemBrightnessAsync()
    ).then((value) => {
      alert(value);
    });
  }

  function updateBrightnessAsync(value: number, type: string) {
    setSliderBrightness((brightness) => ({ ...brightness, [type]: value }));
    if (type === 'Brightness') {
      Brightness.setBrightnessAsync(value);
    } else {
      Brightness.setSystemBrightnessAsync(value);
    }
  }

  const initBrightness: Record<string, number | null> = {
    Brightness: brightness,
    SystemBrightness: systemBrightness,
  };

  const views = brightnessTypes.map((type) => {
    const currentBrightness = initBrightness[type] ?? 0;
    return (
      <View key={type} style={{ padding: 20 }}>
        <HeadingText>{type}</HeadingText>
        {/* you can attempt to request permission even if already granted, but it will noop */}
        {type === 'SystemBrightness' && (
          <Button
            title={`Request permissions ${
              systemBrightnessPermissionGranted ? ' (already granted)' : ''
            }`}
            onPress={async () => {
              const { granted } = await Brightness.requestPermissionsAsync();
              setSystemBrightnessPermissionGranted(granted);
            }}
            style={{ marginTop: 15 }}
          />
        )}
        <Button
          title={'get' + type + 'Async'}
          onPress={() => alertBrightnessAsync(type)}
          style={{ marginTop: 15, marginBottom: 20 }}
        />
        <Text style={{ marginBottom: -2 }}>
          {'set' + type + 'Async: '}
          {(sliderBrightness[type] || currentBrightness).toFixed(3)}
        </Text>
        <Slider
          value={currentBrightness}
          disabled={type === 'SystemBrightness' && !systemBrightnessPermissionGranted}
          onValueChange={(value) => updateBrightnessAsync(value, type)}
        />
      </View>
    );
  });
  return <ScrollView style={{ flex: 1 }}>{views}</ScrollView>;
}

BrightnessScreen.navigationOptions = {
  title: 'Brightness',
};
