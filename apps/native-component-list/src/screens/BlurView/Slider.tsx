import Slider from '@react-native-community/slider';
import React, { memo } from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';

interface Props {
  title: string;
  value: number;
  active: boolean;
  onChange: (value: number) => void;
  style?: ViewStyle;
}

export default memo(({ title, onChange, value, active, style }: Props) => {
  return (
    <View style={[styles.container, active && styles.containerActive, style]}>
      <Text style={(styles.label, active && styles.labelActive)}>{title}</Text>
      <View style={styles.wrapper}>
        <Text style={styles.sliderBoundText}>1</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={100}
          step={1}
          onValueChange={onChange}
          value={value}
          minimumTrackTintColor={active ? 'rgb(20,120,20)' : undefined}
          maximumTrackTintColor={active ? 'rgba(140,180,140, 0.8)' : undefined}
        />
        <Text>100</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgb(100,20,20)',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  containerActive: {
    borderColor: 'rgb(20,100,20)',
  },
  label: {
    color: 'rgb(240,240,240)',
  },
  labelActive: {
    color: 'rgb(20,120,20)',
    fontWeight: 'bold',
  },
  wrapper: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  slider: {
    width: 150,
    height: 20,
    flexGrow: 0,
  },
  sliderActive: {
    color: 'rgb(20,120,20)',
  },
  sliderBoundText: {
    paddingHorizontal: 5,
  },
});
