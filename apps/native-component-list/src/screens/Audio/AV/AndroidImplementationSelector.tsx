import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

interface Props {
  onToggle: (value: boolean) => void;
  title?: string;
  disabled?: boolean;
  toggled: boolean;
}

export const AndroidImplementationSelector = ({
  title = 'Android Implementation',
  disabled = false,
  toggled = false,
  onToggle,
}: Props) => {
  return (
    <View style={{ marginTop: 5 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 5,
          borderBottomWidth: 1.0 / PixelRatio.get(),
          borderBottomColor: '#cccccc',
        }}>
        <Text style={{ flex: 1, fontSize: 16 }}>{title}</Text>
        <Switch disabled={disabled} value={toggled} onValueChange={onToggle} />
      </View>
    </View>
  );
};
