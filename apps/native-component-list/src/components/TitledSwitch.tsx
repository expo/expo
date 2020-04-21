import { B } from '@expo/html-elements';
import React from 'react';
import { StyleSheet, Switch, View, TextStyle, ViewStyle } from 'react-native';

export default function TitleSwitch({
  style,
  titleStyle,
  title,
  value,
  setValue,
}: {
  style?: ViewStyle;
  titleStyle?: TextStyle;
  title?: string;
  value: boolean;
  setValue: (value: boolean) => void;
}) {
  return (
    <View style={[styles.container, style]}>
      <B style={[styles.title, titleStyle]}>{title}</B>
      <Switch value={value} onValueChange={value => setValue(value)} />
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
