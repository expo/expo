import { B } from '@expo/html-elements';
import { Picker } from '@react-native-community/picker';
import * as React from 'react';
import { StyleSheet, View, TextStyle, ViewStyle } from 'react-native';

export default function TitledPicker({
  style,
  titleStyle,
  title,
  value,
  setValue,
  items,
  disabled,
}: {
  style?: ViewStyle;
  titleStyle?: TextStyle;
  title?: string;
  value: string;
  items: { key: string; value: string }[];
  disabled?: boolean;
  setValue: (value: string) => void;
}) {
  const outputTitle = disabled ? `${title} (Disabled)` : title;

  return (
    <View style={[styles.container, style]}>
      <B style={[styles.title, titleStyle]}>{outputTitle}</B>
      <Picker
        selectedValue={value}
        enabled={!disabled}
        onValueChange={value => setValue(`${value}`)}>
        {items.map(({ key, value }) => (
          <Picker.Item label={value} value={key} key={key} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    justifyContent: 'space-between',
  },
  title: {
    marginRight: 12,
  },
  text: {
    marginVertical: 15,
    maxWidth: '80%',
    marginHorizontal: 10,
  },
});
