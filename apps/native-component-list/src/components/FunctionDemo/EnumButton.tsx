import { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

import Colors from '../../constants/Colors';
import { PrimitiveArgument } from './index.types';

// Exclude boolean as this type should not be handled by this component.
type Value = Exclude<PrimitiveArgument, boolean>;
type EnumValue = { name: string; value: Value };

type Props = {
  value: Value;
  onChange: (value: Value) => void;
  values: Value[] | EnumValue[];
  disabled?: boolean;
};

function valuesAreEnumValues(values: Value[] | EnumValue[]): values is EnumValue[] {
  return !values.some(
    (value) => typeof value !== 'object' || !('name' in value) || !('value' in value)
  );
}

function useEnumValues(values: Value[] | EnumValue[]): values is EnumValue[] {
  return useMemo(() => valuesAreEnumValues(values), [values]);
}

/**
 * Button component that upon every press switches to the next value from the array.
 */
export default function EnumButton({ value, onChange, values, disabled }: Props) {
  const valuesAreEnums = useEnumValues(values);

  const handleOnPress = useCallback(() => {
    const newValue = valuesAreEnums
      ? values[(values.findIndex((v) => v.value === value) + 1) % values.length].value
      : values[(values.findIndex((v) => v === value) + 1) % values.length];
    return onChange(newValue);
  }, [valuesAreEnums, onChange, value, values]);

  return (
    <View style={[styles.button, disabled && styles.buttonDisabled]}>
      <TouchableOpacity disabled={disabled} onPress={handleOnPress}>
        <Text style={styles.text}>
          {valuesAreEnums ? values.find((element) => element.value === value)?.name : value}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
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
