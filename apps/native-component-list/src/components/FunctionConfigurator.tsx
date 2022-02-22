import Checkbox from 'expo-checkbox';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';

import Colors from '../constants/Colors';
import {
  EnumParameter,
  FunctionArgument,
  FunctionParameter,
  NumberParameter,
  Parameter,
  PrimitiveArgument,
  PrimitiveParameter,
  StringParameter,
} from './FunctionDemo.types';

type FunctionConfiguratorProps = {
  parameters: FunctionParameter[];
  value: FunctionArgument[];
  onChange: (name: string | [string, string], newValue: PrimitiveArgument) => void;
};

export default function FunctionConfigurator({
  parameters,
  value,
  onChange,
}: FunctionConfiguratorProps) {
  return (
    <View style={styles.configurator}>
      {parameters.map((parameter, index) =>
        parameter.type === 'constant' ? null : parameter.type === 'object' ? (
          parameter.properties.map(({ name, ...properties }) => (
            <ConfiguratorChoice
              {...properties}
              name={[parameter.name, name]}
              key={`${parameter.name}.${name}`}
              value={(value[index] as Record<string, PrimitiveArgument>)[name]}
              onChange={onChange}
            />
          ))
        ) : (
          <ConfiguratorChoice
            {...parameter}
            key={parameter.name}
            value={value[index] as PrimitiveArgument}
            onChange={onChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  configurator: {
    marginVertical: 5,
  },
  choice: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    position: 'relative',
  },
  choiceLabel: {
    fontSize: 12,
  },
  choiceLabelDisabled: {
    textDecorationLine: 'line-through',
  },
  checkbox: {
    marginLeft: 5,
  },
  enumButton: {
    marginLeft: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
  },
  enumButtonText: {
    fontSize: 10,
    padding: 2,
    fontWeight: '500',
    color: 'white',
  },
  enumButtonDisabled: {
    backgroundColor: '#CCD6DD',
  },

  platformsContainer: {
    position: 'absolute',
    top: -2,
    left: 0,
    flexDirection: 'row',
  },
  platform: {
    borderRadius: 10,
    paddingHorizontal: 3,
    marginRight: 2,
  },
  platformandroid: {
    backgroundColor: '#79bf2d',
  },
  platformios: {
    backgroundColor: '#909090',
  },
  platformweb: {
    backgroundColor: '#4b4bff',
  },
  platformText: {
    fontSize: 6,
    color: 'white',
  },
});

type ConfiguratorChoiceProps = {
  name: string | [string, string];
  platforms?: Parameter['platforms'];
  type: PrimitiveParameter['type'];
  values?: (StringParameter | NumberParameter | EnumParameter)['values'];
  value: PrimitiveArgument;
  onChange: (name: string | [string, string], value: PrimitiveArgument) => void;
};

function PlatformIndicator({ platform }: { platform: 'android' | 'ios' | 'web' }) {
  return (
    <View style={[styles.platform, styles[`platform${platform}`]]}>
      <Text style={styles.platformText}>{platform}</Text>
    </View>
  );
}

function ConfiguratorChoice({
  name,
  value,
  onChange,
  type,
  values,
  platforms = [],
}: ConfiguratorChoiceProps) {
  const platformNotSupported =
    platforms.length > 0 && !(platforms as string[]).includes(Platform.OS);
  const onChangeCallback = useCallback(
    (newValue: PrimitiveArgument) => onChange(name, newValue),
    [name, onChange]
  );

  return (
    <View style={styles.choice}>
      <View style={styles.platformsContainer}>
        {platforms.map((platform) => (
          <PlatformIndicator key={platform} platform={platform} />
        ))}
      </View>
      <Text style={[styles.choiceLabel, platformNotSupported && styles.choiceLabelDisabled]}>
        {Array.isArray(name) ? name.join('.') : name}
      </Text>
      {type === 'boolean' ? (
        <Checkbox
          disabled={platformNotSupported}
          style={styles.checkbox}
          onValueChange={onChangeCallback}
          value={value as boolean}
        />
      ) : (
        <EnumButton
          disabled={platformNotSupported}
          type={type}
          value={value as PrimitiveArgument}
          onChange={onChangeCallback}
          values={values!}
        />
      )}
    </View>
  );
}

function EnumButton({
  value,
  onChange,
  values,
  type,
  disabled,
}: {
  value: PrimitiveArgument;
  onChange: (value: PrimitiveArgument) => void;
  values: StringParameter['values'] | NumberParameter['values'] | EnumParameter['values'];
  type: PrimitiveParameter['type'];
  disabled?: boolean;
}) {
  const handleOnPress = useCallback(() => {
    const newValue =
      values[
        (values.findIndex((v) => (typeof v === 'object' ? v.value : v) === value) + 1) %
          values.length
      ];
    onChange(typeof newValue === 'object' ? newValue.value : newValue);
  }, [onChange, value, values]);

  return (
    <View style={[styles.enumButton, disabled && styles.enumButtonDisabled]}>
      <TouchableOpacity disabled={disabled} onPress={handleOnPress}>
        <Text style={styles.enumButtonText}>
          {type === 'enum'
            ? (values as EnumParameter['values']).find((element) => element.value === value)?.name
            : value}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
