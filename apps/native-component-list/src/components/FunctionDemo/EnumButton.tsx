import { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

import { PrimitiveArgument } from './index.types';
import Colors from '../../constants/Colors';

// Exclude boolean as this type should not be handled by this component.
type Value = Exclude<PrimitiveArgument, boolean>;
type EnumValue = { name: string; value: Value };

type Props = {
  value: Value;
  onChange: (value: Value) => void;
  values: Value[] | EnumValue[];
  disabled?: boolean;
};

function valuesAreEnumValues(values: (Value | EnumValue)[]): values is EnumValue[] {
  return values.every((value) => typeof value === 'object' && 'name' in value && 'value' in value);
}

function useEnumValues(values: Value[] | EnumValue[]): values is EnumValue[] {
  return useMemo(() => valuesAreEnumValues(values), [values]);
}

function getSuccessorCyclically(values: Value[], value: Value) {
  const valueIdx = values.findIndex((v) => v === value);
  const successorIdx = (valueIdx + 1) % values.length;
  return values[successorIdx];
}

/**
 * Button component that upon every press switches to the next value from the array.
 */
export default function EnumButton({ value, onChange, values, disabled }: Props) {
  const valuesAreEnums = useEnumValues(values);

  const handleOnPress = useCallback(() => {
    const plainValues = valuesAreEnums ? values.map((v) => v.value) : values;
    const newValue = getSuccessorCyclically(plainValues, value);
    return onChange(newValue);
  }, [valuesAreEnums, onChange, value, values]);

  return (
    <TouchableOpacity disabled={disabled} onPress={handleOnPress}>
      <View style={[styles.button, disabled && styles.buttonDisabled]}>
        <Text style={styles.text}>
          {valuesAreEnums ? values.find((element) => element.value === value)?.name : value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
    minWidth: 30,
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    padding: 2,
    fontWeight: '500',
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#CCD6DD',
  },
});
