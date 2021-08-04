// @needsRefactor

import Ionicons from '@expo/vector-icons/build/Ionicons';
import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Colors } from 'expo-stories/shared/constants';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const pitchControlHeight = 36;
const volumeIndicatorHeight = 36;

function PitchControl({
  value,
  disabled,
  onPress,
}: {
  disabled: boolean;
  value: boolean;
  onPress: (value: boolean) => void;
}) {
  const color = value ? Colors.tintColor : '#C1C1C1';

  return (
    <TouchableOpacity
      disabled={disabled}
      style={styles.pitchControlContainer}
      onPress={() => {
        onPress(!value);
      }}>
      <Ionicons name="ios-stats-chart" size={24} color={color} style={{}} />
      <Text
        style={[
          styles.pitchControlLabel,
          { textDecorationLine: disabled ? 'line-through' : 'none', color },
        ]}>
        Correct Pitch
      </Text>
    </TouchableOpacity>
  );
}

function VolumeSlider({
  volume,
  isMuted,
  disabled,
  color = Colors.tintColor,
  onValueChanged,
  style,
}: {
  volume: number;
  isMuted: boolean;
  disabled?: boolean;
  color?: string;
  style?: any;
  onValueChanged: (data: { isMuted: boolean; volume: number }) => void;
}) {
  const [value, setValue] = React.useState(volume);
  const lastUserValue = React.useRef(volume);

  React.useEffect(() => {
    if (!isMuted && lastUserValue.current !== value) {
      const value = lastUserValue.current;
      setValue(value);
      onValueChanged({ isMuted, volume: value });
    }
  }, [isMuted]);

  const isMutedActive = React.useMemo(() => {
    return isMuted || value <= 0;
  }, [isMuted, value]);

  const iconName = React.useMemo(() => {
    if (isMutedActive) {
      return 'volume-off';
    }
    return value > 0.5 ? 'volume-high' : 'volume-low';
  }, [isMutedActive, value]);

  React.useEffect(() => {
    if (value !== volume) {
      onValueChanged({ volume, isMuted });
    }
  }, [volume]);

  const height = 36;
  return (
    <View
      style={[styles.volumeSliderContainer, disabled && { opacity: 0.7 }, style]}
      pointerEvents={disabled ? 'none' : 'auto'}>
      <TouchableOpacity
        style={styles.volumeIndicatorContainer}
        onPress={() => {
          onValueChanged({ isMuted: !isMuted, volume });
        }}>
        <Ionicons
          name={`ios-${iconName}` as 'ios-volume-high' | 'ios-volume-low' | 'ios-volume-off'}
          size={24}
          color={color}
        />
      </TouchableOpacity>
      <Slider
        value={isMutedActive ? 0 : value}
        maximumValue={1}
        style={{ height, flex: 1 }}
        thumbTintColor={color}
        minimumTrackTintColor={color}
        onSlidingComplete={value => {
          onValueChanged({ isMuted: value <= 0, volume: value });

          if (value > 0) {
            lastUserValue.current = value;
          }
        }}
        onValueChange={value => {
          setValue(value);
        }}
      />
    </View>
  );
}

function SpeedSegmentedControl({ onValueChange }: { onValueChange: (value: number) => void }) {
  const data = ['0.5', '1.0', '1.5', '2.0'];
  const [index, setIndex] = React.useState(1);

  const renderIcon = (name: string) => (
    <Ionicons
      name={`ios-${name}` as 'ios-hourglass' | 'ios-speedometer'}
      size={24}
      style={{ color: Colors.tintColor, paddingHorizontal: 8 }}
    />
  );

  return (
    <View style={styles.speedSegmentedControlsContainer}>
      {renderIcon('hourglass')}

      <SegmentedControl
        style={styles.speedSegmentedControls}
        values={data.map(i => i + 'x')}
        fontStyle={{ color: Colors.tintColor }}
        selectedIndex={index}
        tintColor="white"
        onChange={event => {
          setIndex(event.nativeEvent.selectedSegmentIndex);
        }}
        onValueChange={value => onValueChange(parseFloat(value))}
      />
      {renderIcon('speedometer')}
    </View>
  );
}

const styles = StyleSheet.create({
  pitchControlContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 4,
    height: pitchControlHeight,
    justifyContent: 'center',
  },

  pitchControlLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },

  volumeSliderContainer: { flexDirection: 'row', width: 100 },
  volumeIndicatorContainer: {
    alignItems: 'center',
    width: volumeIndicatorHeight,
    height: volumeIndicatorHeight,
    justifyContent: 'center',
  },

  speedSegmentedControlsContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    margin: 10,
    marginTop: 5,
    flexDirection: 'row',
  },
  speedSegmentedControls: { width: '50%', minWidth: 260 },
});

export { PitchControl, VolumeSlider, SpeedSegmentedControl, Slider };
