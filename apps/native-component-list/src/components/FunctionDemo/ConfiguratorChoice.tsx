import Checkbox from 'expo-checkbox';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import EnumButton from './EnumButton';
import Platforms from './Platforms';
import {
  EnumParameter,
  NumberParameter,
  Platform,
  PrimitiveArgument,
  PrimitiveParameter,
  StringParameter,
} from './index.types';
import { isCurrentPlatformSupported } from './utils';

type Name = string | [objectName: string, propertyName: string];
export type OnChangeCallback = (name: Name, value: PrimitiveArgument) => void;

type Props = {
  name: Name;
  platforms?: Platform[];
  type: PrimitiveParameter['type'];
  values?: (StringParameter | NumberParameter | EnumParameter)['values'];
  value: PrimitiveArgument;
  onChange: OnChangeCallback;
};

export default function ConfiguratorChoice({
  name,
  value,
  onChange,
  type,
  values = [],
  platforms = [],
}: Props) {
  const isPlatformSupported = isCurrentPlatformSupported(platforms);
  const disabled = !isPlatformSupported;
  const onChangeCallback = useCallback(
    (newValue: PrimitiveArgument) => onChange(name, newValue),
    [name, onChange]
  );

  return (
    <View style={styles.container}>
      <Platforms platforms={platforms} />
      <Text style={[styles.label, disabled && styles.labelDisabled]}>
        {Array.isArray(name) ? name.join('.') : name}
      </Text>
      {type === 'boolean' ? (
        <Checkbox
          disabled={disabled}
          style={styles.checkbox}
          onValueChange={onChangeCallback}
          value={value as boolean}
        />
      ) : (
        <EnumButton
          disabled={disabled}
          value={value as Exclude<PrimitiveArgument, boolean>}
          onChange={onChangeCallback}
          values={values}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    position: 'relative',
  },
  label: {
    fontSize: 12,
  },
  labelDisabled: {
    textDecorationLine: 'line-through',
  },
  checkbox: {
    marginLeft: 5,
  },
});
