import Checkbox from 'expo-checkbox';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';
import {
  EnumParameter,
  FunctionArgument,
  FunctionParameter,
  NumberParameter,
  PrimitiveArgument,
  PrimitiveParameter,
  StringParameter,
} from './FunctionDemo.types';

type ConfiguratorProps = {
  parameters: FunctionParameter[];
  value: FunctionArgument[];
  onChange: (name: string | [string, string], newValue: PrimitiveArgument) => void;
};

export default function FunctionConfigurator({ parameters, value, onChange }: ConfiguratorProps) {
  return (
    <View style={styles.configurator}>
      {parameters.map((parameter, index) =>
        parameter.type === 'object' ? (
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
  },
  choiceLabel: {
    fontSize: 12,
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
});

type ConfiguratorChoiceProps = {
  name: string | [string, string];
  type: PrimitiveParameter['type'];
  values?: (StringParameter | NumberParameter | EnumParameter)['values'];
  value: PrimitiveArgument;
  onChange: (name: string | [string, string], value: PrimitiveArgument) => void;
};

function ConfiguratorChoice({ name, value, onChange, type, values }: ConfiguratorChoiceProps) {
  const onChangeCallback = useCallback(
    (newValue: PrimitiveArgument) => onChange(name, newValue),
    [name, onChange]
  );

  return (
    <View style={styles.choice}>
      <Text style={styles.choiceLabel}>{Array.isArray(name) ? name.join('.') : name}</Text>
      {type === 'boolean' ? (
        <Checkbox
          style={styles.checkbox}
          onValueChange={onChangeCallback}
          value={value as boolean}
        />
      ) : (
        <EnumButton
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
}: {
  value: PrimitiveArgument;
  onChange: (value: PrimitiveArgument) => void;
  values: StringParameter['values'] | NumberParameter['values'] | EnumParameter['values'];
  type: PrimitiveParameter['type'];
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
    <View style={styles.enumButton}>
      <TouchableOpacity onPress={handleOnPress}>
        <Text style={styles.enumButtonText}>
          {type === 'enum'
            ? (values as EnumParameter['values']).find((element) => element.value === value)?.name
            : value}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
