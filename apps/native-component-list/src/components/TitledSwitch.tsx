import { B } from '@expo/html-elements';
import React from 'react';
import { StyleSheet, Switch, View, TextStyle, ViewStyle } from 'react-native';

type Props = {
  style?: ViewStyle;
  titleStyle?: TextStyle;
  title?: string;
  value: boolean;
  disabled?: boolean;
  setValue: (value: boolean) => void;
};

const TitleSwitch = ({ style, titleStyle, title, value, setValue, disabled }: Props) => {
  const outputTitle = disabled ? `${title} (Disabled)` : title;
  return (
    <View style={[styles.container, style]}>
      <B style={[styles.title, titleStyle]}>{outputTitle}</B>
      <Switch disabled={disabled} value={value} onValueChange={(value) => setValue(value)} />
    </View>
  );
};

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

export default TitleSwitch;
