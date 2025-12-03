import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButtonVariant, IconButton as JetpackIconButton } from '@expo/ui/jetpack-compose';
import { SymbolView } from 'expo-symbols';

type AppIconButtonProps = {
  icon: string | Record<string, string>;
  tintColor?: string;
  size?: number;
  onPress?: () => void;
  iconSize?: number;
  variant?: IconButtonVariant;
  modifiers?: any[];
  shape?: any;
};

export default function AppIconButton({
  icon,
  tintColor = '#eef',
  variant = 'default',
  size = 24,
  iconSize = 40,
  onPress,
  modifiers,
  shape,
}: AppIconButtonProps) {
  const name = typeof icon === 'string' ? { android: icon } : icon;
  return (
    <JetpackIconButton
      variant={variant}
      modifiers={modifiers}
      onPress={onPress}
      shape={shape}
      elementColors={{ containerColor: '#555577' }}>
      <View style={[styles.host, { width: iconSize, height: iconSize }]}>
        <SymbolView size={size} tintColor={tintColor} name={name} />
      </View>
    </JetpackIconButton>
  );
}

const styles = StyleSheet.create({
  host: {
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});
